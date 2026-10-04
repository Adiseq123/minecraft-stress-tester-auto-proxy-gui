const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const mineflayer = require('mineflayer')
const { SocksClient } = require('socks')
const dns = require('dns')
const axios = require('axios')

let mainWindow = null
let activeBots = []
let activeTimers = []
let activeIntervals = []
let proxyList = []
let isRunning = false

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1050,
    height: 820,
    minWidth: 850,
    minHeight: 650,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: 'Minecraft Stress Tester (Auto SOCKS5 Scraper & Rotator)',
    autoHideMenuBar: true
  })

  mainWindow.loadFile('index.html')
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  stopAll()
  if (process.platform !== 'darwin') app.quit()
})

function logToGUI(msg) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('log-message', msg)
  }
}

function generateRandomUsername(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function formatKickReason(reason) {
  if (!reason) return 'Brak podanego powodu'
  if (typeof reason === 'string') return reason
  try {
    if (typeof reason === 'object') {
      if (reason.text) return reason.text
      return JSON.stringify(reason)
    }
  } catch (e) {
    return String(reason)
  }
  return String(reason)
}

function getHumanDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function fetchAutoProxies() {
  logToGUI('[i] Pobieranie darmowych proxy SOCKS5 z repozytoriów GitHub i ProxyScrape...')

  const sources = [
    'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/socks5.txt',
    'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks5.txt',
    'https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt',
    'https://raw.githubusercontent.com/jetkai/proxy-list/main/online-proxies/txt/proxies-socks5.txt',
    'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=5000&country=all&ssl=all&anonymity=all'
  ]

  const fetchedProxies = new Set()

  for (const url of sources) {
    try {
      const res = await axios.get(url, { timeout: 5000 })
      const lines = res.data.split(/\r?\n/).map(l => l.trim()).filter(l => l && l.includes(':'))
      lines.forEach(line => fetchedProxies.add(line))
    } catch (e) {
      // Ignorowanie błędów pojedynczych repozytoriów
    }
  }

  const rawList = Array.from(fetchedProxies)
  rawList.sort(() => Math.random() - 0.5)

  const parsed = rawList.map(line => {
    const parts = line.split(':')
    return {
      host: parts[0],
      port: parseInt(parts[1], 10),
      userId: parts[2] || undefined,
      password: parts[3] || undefined
    }
  }).filter(p => p.host && !isNaN(p.port))

  logToGUI(`[+] Pobrano łącznie ${parsed.length} unikalnych proxy SOCKS5!`)
  return parsed
}

function parseCustomProxies(rawText) {
  if (!rawText || !rawText.trim()) return []
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l && l.includes(':'))
  return lines.map(line => {
    const parts = line.split(':')
    return {
      host: parts[0],
      port: parseInt(parts[1], 10),
      userId: parts[2] || undefined,
      password: parts[3] || undefined
    }
  }).filter(p => p.host && !isNaN(p.port))
}

function createBot(config, username, index, proxyOffset = 0) {
  if (!isRunning) return

  const proxyIndex = proxyList.length > 0 ? (index + proxyOffset) % proxyList.length : -1
  const proxy = proxyIndex !== -1 ? proxyList[proxyIndex] : null

  const botOptions = {
    host: config.host,
    port: parseInt(config.port, 10),
    username: username,
    version: config.version || false,
    auth: 'offline'
  }

  let proxyFailed = false

  if (proxy) {
    botOptions.connect = (client) => {
      const targetSrv = config.useSrv ? `_minecraft._tcp.${config.host}` : null

      const connectFunc = (targetHost, targetPort) => {
        SocksClient.createConnection({
          proxy: {
            host: proxy.host,
            port: proxy.port,
            type: 5,
            userId: proxy.userId,
            password: proxy.password
          },
          command: 'connect',
          destination: {
            host: targetHost,
            port: targetPort
          },
          timeout: 15000
        }, (err, info) => {
          if (err) {
            if (!proxyFailed && isRunning) {
              proxyFailed = true
              logToGUI(`[X] [${username}] Proxy ${proxy.host}:${proxy.port} niedostępne (${err.message}). Rotacja na kolejne...`)
              const timer = setTimeout(() => {
                createBot(config, generateRandomUsername(10), index, proxyOffset + 1)
              }, 1000)
              activeTimers.push(timer)
            }
            return
          }
          client.setSocket(info.socket)
          client.emit('connect')
        })
      }

      if (targetSrv) {
        dns.resolveSrv(targetSrv, (srvErr, addresses) => {
          const hostToUse = (!srvErr && addresses && addresses.length > 0) ? addresses[0].name : config.host
          const portToUse = (!srvErr && addresses && addresses.length > 0) ? addresses[0].port : parseInt(config.port, 10)
          connectFunc(hostToUse, portToUse)
        })
      } else {
        connectFunc(config.host, parseInt(config.port, 10))
      }
    }
  }

  let bot
  try {
    bot = mineflayer.createBot(botOptions)
  } catch (err) {
    logToGUI(`[X] [${username}] Błąd tworzenia bota: ${err.message}`)
    return
  }

  activeBots.push(bot)
  const botIntervals = []
  let isRateLimited = false
  let hasAttemptedRegister = false
  let hasAttemptedLogin = false

  function safeSetInterval(fn, ms) {
    const timer = setInterval(fn, ms)
    botIntervals.push(timer)
    activeIntervals.push(timer)
    return timer
  }

  function cleanup() {
    botIntervals.forEach(clearInterval)
    const idx = activeBots.indexOf(bot)
    if (idx !== -1) activeBots.splice(idx, 1)
  }

  bot.on('message', (jsonMsg) => {
    const text = jsonMsg.toString().toLowerCase()

    if ((text.includes('/register') || text.includes('zarejestruj')) && !hasAttemptedRegister) {
      hasAttemptedRegister = true
      const delay = getHumanDelay(config.minDelay, config.maxDelay)
      logToGUI(`[i] [${username}] Rejestracja wykryta. Wpisywanie za ${(delay / 1000).toFixed(1)}s...`)
      const timer = setTimeout(() => {
        if (bot && bot.entity) {
          bot.chat(`/register ${config.botPassword} ${config.botPassword}`)
        }
      }, delay)
      activeTimers.push(timer)
    } else if ((text.includes('/login') || text.includes('zaloguj')) && !hasAttemptedLogin) {
      hasAttemptedLogin = true
      const delay = getHumanDelay(config.minDelay, config.maxDelay)
      logToGUI(`[i] [${username}] Logowanie wykryte. Wpisywanie za ${(delay / 1000).toFixed(1)}s...`)
      const timer = setTimeout(() => {
        if (bot && bot.entity) {
          bot.chat(`/login ${config.botPassword}`)
        }
      }, delay)
      activeTimers.push(timer)
    }
  })

  bot.once('spawn', () => {
    const proxyMsg = proxy ? ` [Proxy: ${proxy.host}:${proxy.port}]` : ' [Bezpośrednie]'
    logToGUI(`[+] [${username}] Zalogowano pomyślnie.${proxyMsg}`)

    const regTimer = setTimeout(() => {
      if (!hasAttemptedRegister && !hasAttemptedLogin) {
        hasAttemptedRegister = true
        bot.chat(`/register ${config.botPassword} ${config.botPassword}`)
      }
    }, getHumanDelay(3000, 7000))
    activeTimers.push(regTimer)

    safeSetInterval(() => {
      if (!bot.entity) return
      const directions = ['forward', 'back', 'left', 'right']
      const randomDirection = directions[Math.floor(Math.random() * directions.length)]

      bot.setControlState('sprint', Math.random() > 0.4)
      bot.setControlState('jump', Math.random() > 0.5)
      bot.setControlState('sneak', Math.random() > 0.8)

      bot.setControlState(randomDirection, true)
      setTimeout(() => {
        if (bot && bot.entity) {
          bot.setControlState(randomDirection, false)
        }
      }, 500 + Math.random() * 1000)

      if (Math.random() > 0.3) {
        bot.swingArm('mainhand')
      }
    }, parseInt(config.actionIntervalMs, 10) + Math.random() * 2000)

    safeSetInterval(() => {
      if (!bot.entity) return
      const yaw = (Math.random() * Math.PI * 2) - Math.PI
      const pitch = (Math.random() * Math.PI) - (Math.PI / 2)
      bot.look(yaw, pitch, true).catch(() => {})
    }, 1500 + Math.random() * 1000)

    safeSetInterval(() => {
      if (!bot.entity) return
      if (config.messages.length > 0 && Math.random() < 0.7) {
        const msg = config.messages[Math.floor(Math.random() * config.messages.length)]
        bot.chat(`${msg} [${Math.floor(Math.random() * 8999 + 1000)}]`)
      } else if (config.commands.length > 0) {
        const cmd = config.commands[Math.floor(Math.random() * config.commands.length)]
        bot.chat(cmd)
      }
    }, parseInt(config.chatIntervalMs, 10) + Math.random() * 4000)
  })

  bot.on('kicked', (reason) => {
    const parsedReason = formatKickReason(reason)
    logToGUI(`[!] [${username}] Wyrzucony: ${parsedReason}`)
    if (parsedReason.toLowerCase().includes('zbyt często') || parsedReason.toLowerCase().includes('frequently')) {
      isRateLimited = true
    }
  })

  bot.on('error', (err) => {
    if (!proxyFailed) {
      logToGUI(`[X] [${username}] Błąd: ${err.message}`)
    }
  })

  bot.once('end', () => {
    cleanup()
    if (proxyFailed || !isRunning) return

    const waitTime = isRateLimited
      ? 30000 + Math.random() * 10000
      : parseInt(config.reconnectDelayMs, 10) + (index * 1000)

    logToGUI(`[-] [${username}] Rozłączono. Ponowne łączenie za ${Math.round(waitTime / 1000)}s...`)
    const timer = setTimeout(() => {
      createBot(config, generateRandomUsername(10), index, proxyOffset + 1)
    }, waitTime)
    activeTimers.push(timer)
  })
}

function stopAll() {
  isRunning = false
  activeTimers.forEach(clearTimeout)
  activeTimers = []
  activeIntervals.forEach(clearInterval)
  activeIntervals = []
  activeBots.forEach(bot => {
    try { bot.quit() } catch (e) {}
  })
  activeBots = []
}

ipcMain.on('start-stress-test', async (event, config) => {
  stopAll()
  isRunning = true

  logToGUI('=== ROZPOCZYNANIE TESTU (AUTO PROXY / ROTACJA) ===')

  let proxies = []
  if (config.autoScrape) {
    proxies = await fetchAutoProxies()
  }

  const customProxies = parseCustomProxies(config.proxyInputRaw)
  if (customProxies.length > 0) {
    logToGUI(`[+] Dołączono ${customProxies.length} własnych proxy z pola tekstowego.`)
    proxies = customProxies.concat(proxies)
  }

  proxyList = proxies

  if (proxyList.length === 0) {
    logToGUI('[!] Uwaga: Brak dostępnych proxy SOCKS5. Test uruchomi się bezpośrednio z Twojego IP!')
  }

  const botCount = parseInt(config.botCount, 10)
  const spawnDelay = parseInt(config.spawnDelayMs, 10)

  logToGUI(`[i] Uruchamianie ${botCount} botów z interwałem ${spawnDelay}ms...`)

  for (let i = 0; i < botCount; i++) {
    if (!isRunning) break
    const timer = setTimeout(() => {
      const randomNick = generateRandomUsername(10)
      createBot(config, randomNick, i)
    }, i * spawnDelay)
    activeTimers.push(timer)
  }
})

ipcMain.on('stop-stress-test', () => {
  stopAll()
  logToGUI('=== ZATRZYMANO TESTOWANIE ===')
})