# 🚀 OpenOKAPI

<p align="center">
  <strong>Einheitliche API für mehrere KI-Anbieter | OpenAI • Claude • Discord-Integration</strong>
  <br><br>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://discord.gg/yAVQXusPJd"><img src="https://img.shields.io/discord/1467172467507335403?label=Discord&logo=discord&logoColor=white&color=5865F2&style=for-the-badge" alt="Discord"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

**OpenOKAPI** ist ein Open-Source-Projekt, das entwickelt wurde, um eine einheitliche Plattform für die Interaktion mit mehreren KI-Systemen über eine einzige, konsistente API zu schaffen.

Das Ziel des Projekts ist es, verschiedene KI-Anbieter und Chat-Plattformen in ein Ökosystem zu integrieren, das es Benutzern ermöglicht, mit verschiedenen KI-Modellen zu kommunizieren, ohne sich mit separaten APIs und Tools auseinanderzusetzen.

---

## 📌 Projektkonzept

OpenOKAPI fungiert als Brücke zwischen Benutzern und mehreren KI-Plattformen.

Der Arbeitsablauf ist einfach:

1. Der Benutzer sendet eine Anfrage an den OpenOKAPI-Server
2. Der Server wählt die entsprechende KI-Integration aus
3. Daten werden mit dem entsprechenden API-Schlüssel weitergeleitet
4. Die Antwort wird in einem standardisierten Format zurückgegeben

Dieser Ansatz macht es einfach, zwischen KI-Anbietern zu wechseln und alles von einem Ort aus zu verwalten.

---

## 🎯 Funktionen

Geplante und derzeit entwickelte Funktionen umfassen:

- 🔌 Integration mit mehreren KI-Plattformen
- 🧩 Modulare Architektur für einfache Erweiterung
- 💻 CLI-Schnittstelle für Verwaltung und Interaktion
- 🌐 Web-Dashboard zur Konfiguration
- 🤖 Integrationen mit Kommunikationsplattformen:
  - Discord
- 🤖 KI-Plattformen:
  - OpenAI
  - Claude
  - Ollama
- 🔐 Sichere API-Schlüsselverwaltung
- 📡 Selbstgehosteter OpenOKAPI-Server

---

## 🌐 Gateway API

OpenOKAPI enthält einen integrierten HTTP/WebSocket-API-Server, der Fernzugriff auf alle KI-Integrationen bietet.

### Funktionen:

- 🔒 **Sichere Authentifizierung** - API-Schlüsselvalidierung und User-Agent-Verifizierung
- 🚀 **RESTful API** - Spiegelung aller CLI-Befehle als HTTP-Endpunkte
- 🔌 **WebSocket-Unterstützung** - Bidirektionale Echtzeitkommunikation
- ⚙️ **Konfigurierbar** - Benutzerdefinierter Port über Umgebungsvariable (Standard: 16273)

### Schnellstart:

```bash
# API-Schlüssel generieren
openokapi generate api-key

# Gateway-Server starten
openokapi gateway

# Oder benutzerdefinierten Port angeben
openokapi gateway --port 8080
```

### Verfügbare Endpunkte:

**Claude:**

- `GET /api/claude/status` - Konfigurationsstatus abrufen
- `POST /api/claude/ask` - Prompt senden (body: `{prompt, model?}`)

**OpenAI:**

- `GET /api/openai/status` - Konfigurationsstatus abrufen
- `POST /api/openai/ask` - Prompt senden (body: `{prompt, model?}`)

**Ollama:**

- `GET /api/ollama/status` - Konfigurationsstatus abrufen
- `GET /api/ollama/list` - Alle Modelle auflisten
- `GET /api/ollama/search?query=...` - Modelle durchsuchen
- `GET /api/ollama/info?model=...` - Modellinformationen abrufen
- `POST /api/ollama/ask` - Prompt senden (body: `{prompt, model?}`)
- `POST /api/ollama/pull` - Modell herunterladen (body: `{model}`)
- `DELETE /api/ollama/delete` - Modell löschen (body: `{model}`)

### Beispielanfrage:

```bash
curl -X POST http://localhost:16273/api/openai/ask \
  -H "Content-Type: application/json" \
  -H "User-Agent: OPENOKAPI/1.0" \
  -H "X-API-Key: dein-api-schluessel" \
  -d '{"prompt": "Hallo Welt!"}'
```

---

## 🤝 Beitragen

OpenOKAPI ist ein von der Gemeinschaft getriebenes Projekt und wir suchen nach Mitwirkenden!

Wir freuen uns auf jeden, der:

- **TypeScript** kennt
- zu Open-Source beitragen möchte
- Ideen für neue Funktionen hat
- bei der Entwicklung der CLI, des Web-Panels oder der Integrationen helfen möchte

Erfahrungsstufe spielt keine Rolle – was zählt, ist Motivation und Bereitschaft zu helfen 💙

---

## 🚀 Wie man Beiträge leistet

Wenn du einen Beitrag leisten möchtest:

1. Forke das Repository
2. Erkunde die Dokumentation
3. Wähle ein Issue aus, an dem du arbeiten möchtest
4. Sende einen Pull Request

Jeder Beitrag wird geschätzt – Code, Tests, Dokumentation, Ideen!

---

## 📬 Kontakt & Gemeinschaft

Tritt unserer Discord-Gemeinschaft bei und hilf mit, OpenOKAPI zu entwickeln:

💬 **Discord:** https://discord.gg/yAVQXusPJd

Zögere nicht, dich zu melden, Fragen zu stellen oder neue Ideen vorzuschlagen!

---

## ⭐ Sternverlauf

[![Star History Chart](https://api.star-history.com/svg?repos=ColiberAI/openokapi&type=Date)](https://star-history.com/#ColiberAI/openokapi&Date)

## ❤️ Mitwirkende

Danke an alle, die dazu beitragen, dieses Projekt besser zu machen!

<a href="https://github.com/ColiberAI/openokapi/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ColiberAI/openokapi" />
</a>

---

### ✨ OpenOKAPI – KI für alle!
