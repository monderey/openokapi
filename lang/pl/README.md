# 🚀 OpenOKAPI

<p align="center">
  <strong>Zjednoczony interfejs API dla wielu dostawców AI | OpenAI • Claude • Integracja Discord</strong>
  <br><br>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://discord.gg/RF8CgZbx2P"><img src="https://img.shields.io/discord/1492979180084920331?label=Discord&logo=discord&logoColor=white&color=5865F2&style=for-the-badge" alt="Discord"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

**OpenOKAPI** to projekt open-source stworzony w celu zbudowania ujednoliconej platformy do komunikacji z wieloma systemami AI poprzez jeden, spójny interfejs API.

Celem projektu jest integracja różnych dostawców AI i platform czatu w jeden ekosystem, umożliwiając użytkownikom komunikację z różnymi modelami AI bez konieczności korzystania z oddzielnych API i narzędzi.

---

## 📌 Koncepcja Projektu

OpenOKAPI pełni rolę mostu między użytkownikami a wieloma platformami AI.

Przepływ pracy jest prosty:

1. Użytkownik wysyła żądanie do serwera OpenOKAPI
2. Serwer wybiera odpowiednią integrację AI
3. Dane są przesyłane za pomocą odpowiedniego klucza API
4. Odpowiedź jest zwracana w ustandaryzowanym formacie

To podejście ułatwia przełączanie między dostawcami AI i zarządzanie wszystkim z jednego miejsca.

---

## 🎯 Funkcjonalności

Planowane i aktualnie rozwijane funkcjonalności to:

- 🔌 Integracja z wieloma platformami AI
- 🧩 Modularna architektura ułatwiająca rozszerzenia
- 💻 Interfejs CLI do zarządzania i interakcji
- 🌐 Pulpit nawigacyjny do konfiguracji
- 🤖 Integracje z platformami komunikacyjnymi:
  - Discord
- 🤖 Platformy AI:
  - OpenAI
  - Claude
  - Ollama
- 🔐 Bezpieczne zarządzanie kluczami API
- 📡 Samodzielnie hostowany serwer OpenOKAPI

---

## 🌐 Gateway API

OpenOKAPI zawiera wbudowany serwer HTTP/WebSocket API, który zapewnia zdalny dostęp do wszystkich integracji AI.

### Funkcje:

- 🔒 **Bezpieczne Uwierzytelnianie** - Walidacja klucza API i weryfikacja User-Agent
- 🚀 **RESTful API** - Lustrzane odbicie wszystkich komend CLI jako endpointy HTTP
- 🔌 **Wsparcie WebSocket** - Komunikacja dwukierunkowa w czasie rzeczywistym
- 📚 **Historia Żądań** - Lokalny dziennik audytu z historią aktywności i statystykami
- ⚙️ **Konfigurowalne** - Własny port przez zmienną środowiskową (domyślnie: 16273)

### Szybki Start:

```bash
# Wygeneruj klucz API
openokapi generate api-key

# Uruchom serwer Gateway
openokapi gateway

# Lub określ niestandardowy port
openokapi gateway --port 8080

# Wyświetl lokalną historię żądań
openokapi history --stats --limit 10

# Opcjonalnie: ustaw fallback providera dla failovera
openokapi config --set-fallback claude

# Uruchom żądania wsadowe z pliku JSON
openokapi batch --file ./requests.json --concurrency 4
```

Otwórz wbudowany panel na `http://localhost:16273/panel` po uruchomieniu gateway.

### Dostępne Endpointy:

**Claude:**

- `GET /api/claude/status` - Pobierz status konfiguracji
- `POST /api/claude/ask` - Wyślij prompt (body: `{prompt, model?}`)
- `POST /api/claude/stream` - Przesyłaj odpowiedź jako SSE (body: `{prompt, model?}`)

**OpenAI:**

- `GET /api/openai/status` - Pobierz status konfiguracji
- `POST /api/openai/ask` - Wyślij prompt (body: `{prompt, model?}`)
- `POST /api/openai/stream` - Przesyłaj odpowiedź jako SSE (body: `{prompt, model?}`)

**Ollama:**

- `GET /api/ollama/status` - Pobierz status konfiguracji
- `GET /api/ollama/list` - Lista wszystkich modeli
- `GET /api/ollama/search?query=...` - Wyszukaj modele
- `GET /api/ollama/info?model=...` - Informacje o modelu
- `POST /api/ollama/ask` - Wyślij prompt (body: `{prompt, model?}`)
- `POST /api/ollama/stream` - Przesyłaj odpowiedź jako SSE (body: `{prompt, model?}`)
- `POST /api/ollama/pull` - Pobierz model (body: `{model}`)
- `DELETE /api/ollama/delete` - Usuń model (body: `{model}`)

**Batch + Panel:**

- `POST /api/batch` - Przetwarzaj wiele żądań z kontrolą równoczesności (body: `{requests, concurrency?}`)
- `GET /panel` - Panel przeglądarki z logowaniem klucza API, czatem, trybem streamingu, runnerem wsadowym i widokiem historii

**Historia:**

- `GET /api/history/summary` - Pobierz zagregowane statystyki żądań
- `GET /api/history/recent?limit=...` - Pobierz ostatnie żądania, opcjonalnie filtrując po `provider`, `source` lub `action`
- `DELETE /api/history` - Wyczyść lokalną historię żądań

### Przykładowe Żądanie:

```bash
curl -X POST http://localhost:16273/api/openai/ask \
  -H "Content-Type: application/json" \
  -H "User-Agent: OPENOKAPI/1.0" \
  -H "X-API-Key: twoj-klucz-api" \
  -d '{"prompt": "Hello, world!"}'
```

---

## 🤝 Wkład w Projekt

OpenOKAPI to projekt napędzany przez społeczność i szukamy współpracowników!

Zapraszamy każdego, kto:

- zna **TypeScript**
- chce uczestniczyć w projektach open-source
- ma pomysły na nowe funkcjonalności
- chce pomóc w budowaniu CLI, panelu internetowego lub integracji

Poziom doświadczenia nie ma znaczenia – liczy się motywacja i chęć pomocy 💙

---

## 🚀 Jak Dołączyć

Jeśli chcesz przyczynić się do projektu:

1. Zrób fork repozytorium
2. Zapoznaj się z dokumentacją
3. Wybierz zadanie do pracy
4. Prześlij pull request

Każdy wkład jest doceniany – kod, testy, dokumentacja, pomysły!

---

## 📬 Kontakt i Społeczność

Dołącz do naszej społeczności Discord i pomagaj budować OpenOKAPI:

💬 **Discord:** https://discord.gg/RF8CgZbx2P

Nie wahaj się skontaktować, zadawać pytania lub proponować nowe pomysły!

---

## ⭐ Historia gwiazdek

[![Star History Chart](https://api.star-history.com/svg?repos=monderey/openokapi&type=Date)](https://star-history.com/#monderey/openokapi&Date)

## ❤️ Współpracownicy

Dziękujemy każdemu, kto pomaga uczynić ten projekt lepszym!

<a href="https://github.com/monderey/openokapi/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=monderey/openokapi" />
</a>

---

### ✨ OpenOKAPI – Sztuczna Inteligencja dla Wszystkich!
