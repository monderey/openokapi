# 🚀 OpenOKAPI

<p align="center">
  <strong>Einheitliche API für mehrere KI-Anbieter | OpenAI • Claude • Discord-Integration</strong>
  <br><br>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://discord.gg/RF8CgZbx2P"><img src="https://img.shields.io/discord/1492979180084920331?label=Discord&logo=discord&logoColor=white&color=5865F2&style=for-the-badge" alt="Discord"></a>
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
- 📚 **Anfrageverlauf** - Lokales Audit-Protokoll mit Aktivitätsverlauf und Statistiken
- ⚙️ **Konfigurierbar** - Benutzerdefinierter Port über Umgebungsvariable (Standard: 16273)

### Schnellstart:

```bash
# API-Schlüssel generieren
openokapi generate api-key

# Gateway-Server starten
openokapi gateway

# Oder benutzerdefinierten Port angeben
openokapi gateway --port 8080

# Zeige lokalen Anfrageverlauf an
openokapi history --stats --limit 10

# Optional: Legen Sie einen Fallback-Provider für Failover fest
openokapi config --set-fallback claude

# Führen Sie Batch-Anfragen aus einer JSON-Datei aus
openokapi batch --file ./requests.json --concurrency 4
```

Öffnen Sie das eingebaute Panel unter `http://localhost:16273/panel` nach dem Starten des Gateways.

### Verfügbare Endpunkte:

**Claude:**

- `GET /api/claude/status` - Konfigurationsstatus abrufen
- `POST /api/claude/ask` - Prompt senden (body: `{prompt, model?}`)
- `POST /api/claude/stream` - Antwort als SSE streamen (body: `{prompt, model?}`)

**OpenAI:**

- `GET /api/openai/status` - Konfigurationsstatus abrufen
- `POST /api/openai/ask` - Prompt senden (body: `{prompt, model?}`)
- `POST /api/openai/stream` - Antwort als SSE streamen (body: `{prompt, model?}`)

**Ollama:**

- `GET /api/ollama/status` - Konfigurationsstatus abrufen
- `GET /api/ollama/list` - Alle Modelle auflisten
- `GET /api/ollama/search?query=...` - Modelle durchsuchen
- `GET /api/ollama/info?model=...` - Modellinformationen abrufen
- `POST /api/ollama/ask` - Prompt senden (body: `{prompt, model?}`)
- `POST /api/ollama/stream` - Antwort als SSE streamen (body: `{prompt, model?}`)
- `POST /api/ollama/pull` - Modell herunterladen (body: `{model}`)
- `DELETE /api/ollama/delete` - Modell löschen (body: `{model}`)

**Batch + Panel:**

- `POST /api/batch` - Verarbeiten Sie viele Anfragen mit Parallelitätskontrolle (body: `{requests, concurrency?}`)
- `GET /panel` - Browser-Panel mit API-Schlüssel-Anmeldung, Chat, Stream-Modus, Batch-Runner und Verlaufsansicht

**Verlauf:**

- `GET /api/history/summary` - Aggregierte Anfrage-Statistiken abrufen
- `GET /api/history/recent?limit=...` - Aktuelle Anfragen abrufen, optional gefiltert nach `provider`, `source` oder `action`
- `DELETE /api/history` - Lokalen Anfrageverlauf löschen

### Beispielanfrage:

```bash
curl -X POST http://localhost:16273/api/openai/ask \
  -H "Content-Type: application/json" \
  -H "User-Agent: OPENOKAPI/1.0" \
  -H "X-API-Key: dein-api-schluessel" \
  -d '{"prompt": "Hallo Welt!"}'
```

---

## Automation und Tasks

OpenOKAPI unterstuetzt jetzt einen erweiterten Automatisierungs-Stack im OpenClaw-Stil:

- Scheduler (`cron`, `every`, `at`)
- Automations (regelbasierte Event-Aktionen)
- Heartbeat-Ausfuehrungen
- Event Hooks
- Standing Orders
- Task Flow Orchestrierung
- Background Tasks Ledger (Audit, Cancel, Notify Policy, Maintenance)

Wichtige Befehle:

```bash
openokapi tasks list --status running
openokapi tasks show <lookup>
openokapi tasks audit
openokapi tasks maintenance --status
openokapi tasks flow list --status running
openokapi tasks flow show <lookup>
openokapi tasks flow audit
openokapi tasks flow maintenance --status
openokapi tasks flow maintenance --apply --retention-days 14
openokapi automations --set --name "Auto escalate" --event request.error --actions '[{"type":"dispatchIntegration","event":"automation.error"}]'
openokapi automations --simulate --event request.error --payload '{"provider":"openai","success":false}'
openokapi doctor
openokapi doctor --repair --retention-days 14
openokapi backup list
openokapi backup create
openokapi backup verify <backup-id>
openokapi reset --scope config --dry-run
openokapi reset --scope config+history --yes
openokapi security --json
openokapi security --fix
openokapi self-test
openokapi status
openokapi status --deep --json
openokapi alerts
openokapi alerts --limit 20 --ignore-mute --json
openokapi incidents create --deep --force
openokapi incidents list --status open
openokapi incidents resolve <incident-id> --note "mitigated"
openokapi maintenance-windows --set --name "Deploy" --start-at 2026-01-01T10:00:00Z --end-at 2026-01-01T12:00:00Z --mute-alerts true --mute-incidents true
openokapi maintenance-windows --status --json
openokapi escalations --set --name "Critical errors" --trigger alerts.error --min-severity error --min-count 2 --integration-event escalation.critical --auto-incident true --cooldown-minutes 15
openokapi escalations --run --reason "manual check"
```

Die vollstaendige Referenz ist in `docs/AUTOMATION.md` und `docs/COMMANDS.md`.

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

💬 **Discord:** https://discord.gg/RF8CgZbx2P

Zögere nicht, dich zu melden, Fragen zu stellen oder neue Ideen vorzuschlagen!

---

## ⭐ Sternverlauf

[![Star History Chart](https://api.star-history.com/svg?repos=monderey/openokapi&type=Date)](https://star-history.com/#monderey/openokapi&Date)

## ❤️ Mitwirkende

Danke an alle, die dazu beitragen, dieses Projekt besser zu machen!

<a href="https://github.com/monderey/openokapi/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=monderey/openokapi" />
</a>

---

### ✨ OpenOKAPI – KI für alle!
