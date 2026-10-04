# 🎮 Minecraft Server Stress Tester GUI (Auto SOCKS5 Scraper & Rotator)

<img width="1536" height="829" alt="image" src="https://github.com/user-attachments/assets/9ccc3688-0fe2-4954-bfef-9dd69e56caaa" />

Zaawansowane narzędzie oparte na **Electron + Node.js + Mineflayer**, przeznaczone do kontrolowanego testowania wydajności i stabilności serwerów Minecraft.

Aplikacja oferuje wygodny interfejs GUI, automatyczne agregowanie publicznych proxy SOCKS5 z wielu źródeł, automatyczną rotację połączeń oraz obsługę DNS SRV.

---

## 🚀 Funkcje

- **💻 Wygodny interfejs GUI** — konfiguracja parametrów testu bez konieczności ręcznej edycji kodu.
- **🌐 Auto SOCKS5 Scraper** — automatyczne pobieranie i agregowanie dostępnych list SOCKS5 z publicznych źródeł, m.in. GitHub i ProxyScrape.
- **🔄 Automatyczna rotacja proxy** — w przypadku nieudanego połączenia aplikacja może przejść do kolejnego dostępnego proxy.
- **🤖 Obsługa wielu botów** — możliwość uruchamiania wielu klientów Mineflayer w ramach kontrolowanego testu.
- **✍️ Auto `/register` / `/login`** — wykrywanie wymaganej rejestracji lub logowania i wykonywanie skonfigurowanych komend z odpowiednim opóźnieniem.
- **🎮 Symulacja zachowania gracza** — ruch, obracanie widokiem, skakanie, kucanie, interakcje oraz aktywność na czacie.
- **🛠 DNS SRV Resolver** — automatyczne rozwiązywanie rekordów `_minecraft._tcp`.
- **📋 Real-time Logs** — bieżące informacje o połączeniach, botach, proxy oraz błędach.
- **🔁 Auto-Reconnect** — automatyczna próba ponownego połączenia po utracie połączenia.
- **📦 Build dla Windows/Linux** — możliwość przygotowania samodzielnych plików wykonywalnych.

---

## ⚠️ Ważne ostrzeżenie

**Używasz tego narzędzia na własne ryzyko.**

Autor projektu nie ponosi odpowiedzialności za szkody, problemy z serwerem, utratę danych, blokady kont lub adresów IP ani inne konsekwencje wynikające z niewłaściwego użycia aplikacji.

Narzędzie powinno być wykorzystywane **wyłącznie na własnych serwerach lub w środowiskach, na których przeprowadzanie testów obciążeniowych zostało wyraźnie autoryzowane**.

Nie używaj aplikacji do zakłócania działania cudzych serwerów ani obchodzenia ich zabezpieczeń.

---

## 🌐 Auto SOCKS5 Scraper

Aplikacja może automatycznie pobierać listy publicznych proxy SOCKS5 z wielu dostępnych źródeł.

Proxy są następnie agregowane i mogą być wykorzystywane podczas kontrolowanego testu.

### Obsługiwane źródła

- Publiczne repozytoria GitHub
- ProxyScrape
- Własne listy proxy podane przez użytkownika

Możliwe jest również ręczne podanie proxy w formacie:

`host:port`

lub:

`host:port:user:pass`

---

## 🔄 Rotacja proxy

System rotacji pozwala na automatyczne przechodzenie pomiędzy dostępnymi proxy.

Jeżeli dane proxy nie odpowiada lub połączenie nie może zostać nawiązane, aplikacja może oznaczyć je jako niedostępne i spróbować wykorzystać kolejne.

> Publiczne proxy są często niestabilne, dlatego nie każde pobrane proxy będzie działać poprawnie.

---

## 🛠 DNS SRV Resolver

Aplikacja obsługuje automatyczne rozwiązywanie rekordów DNS SRV:

`_minecraft._tcp`

Dzięki temu możliwe jest poprawne odnajdywanie właściwego hosta oraz portu dla serwerów Minecraft korzystających z konfiguracji SRV.

---

## ⚙️ Konfiguracja w GUI

Przed rozpoczęciem testu możesz skonfigurować m.in.:

| Parametr | Opis |
| :--- | :--- |
| **IP / Domena** | Adres testowanego serwera Minecraft. |
| **Port** | Port serwera lub automatycznie wykryty port SRV. |
| **DNS SRV** | Automatyczne wyszukiwanie rekordu `_minecraft._tcp`. |
| **Auto SOCKS5** | Automatyczne pobieranie dostępnych list proxy. |
| **Własne Proxy** | Własna lista proxy SOCKS5. |
| **Wersja Minecraft** | Wersja używana przez boty. |
| **Liczba botów** | Liczba klientów uruchamianych podczas testu. |
| **Timingi** | Opóźnienia połączeń, reconnectu, czatu i zachowania botów. |
| **Logowanie** | Dane wymagane przez serwer do wykonania `/login` lub `/register`. |

---

## ⚠️ Ważne informacje o darmowych proxy

Darmowe proxy publiczne mają ograniczoną stabilność i jakość.

- Mogą mieć bardzo wysoki ping.
- Mogą przestać działać bez ostrzeżenia.
- Część proxy może odrzucać połączenia.
- Niektóre serwery Minecraft mogą blokować publiczne zakresy adresów IP.
- Dostępność oraz jakość proxy zależy od zewnętrznych dostawców.

**Korzystanie z publicznych proxy odbywa się na własne ryzyko.**

---

## 🛠 Podstawowe wymagania

- **Node.js 18+**
- **npm**
- **Electron**
- **Mineflayer**
- Dostęp do Internetu dla funkcji automatycznego pobierania proxy

---

## 📥 Instalacja i uruchomienie

### 1. Sklonuj repozytorium

```bash
git clone https://github.com/TWOJA_NAZWA/TWOJE_REPOZYTORIUM.git
cd TWOJE_REPOZYTORIUM
```

### 2. Zainstaluj zależności

```bash
npm install
```

### 3. Uruchom aplikację

```bash
npm start
```

---

## 🏗 Kompilacja

### Windows

```bash
npm run dist:win
```

### Linux

```bash
npm run dist:linux
```

Gotowe pliki zostaną wygenerowane w katalogu `dist/`.

---

## 📊 Logi

GUI wyświetla informacje dotyczące działania aplikacji w czasie rzeczywistym, w tym:

- statusu botów,
- prób połączenia,
- wybranego proxy,
- błędów połączenia,
- reconnectów,
- komunikatów serwera,
- aktywności botów.

---

## 📜 Licencja

Projekt jest udostępniany na licencji **GNU General Public License v3.0 (GPL-3.0)**.

Korzystasz z projektu **na własne ryzyko** i ponosisz odpowiedzialność za sposób jego wykorzystania.
