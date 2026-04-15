# 🚀 OpenOKAPI

<p align="center">
  <strong>Unified API for multiple AI providers | OpenAI • Claude • Discord Integration</strong>
  <br><br>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://discord.gg/RF8CgZbx2P"><img src="https://img.shields.io/discord/1492979180084920331?label=Discord&logo=discord&logoColor=white&color=5865F2&style=for-the-badge" alt="Discord"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

**OpenOKAPI** is an open-source project designed to create a unified platform for interacting with multiple AI systems through a single, consistent API.

The goal of the project is to integrate various AI providers and chat platforms into one ecosystem, allowing users to communicate with different AI models without dealing with separate APIs and tools.

---

## 📌 Project Concept

OpenOKAPI acts as a bridge between users and multiple AI platforms.

The workflow is simple:

1. The user sends a request to the OpenOKAPI server
2. The server selects the appropriate AI integration
3. Data is forwarded using the corresponding API key
4. The response is returned in a standardized format

This approach makes it easy to switch between AI providers and manage everything from one place.

---

## 🎯 Features

Planned and currently developed features include:

- 🔌 Integration with multiple AI platforms
- 🧩 Modular architecture for easy extension
- 💻 CLI interface for management and interaction
- 📈 Request history and usage stats
- 🧩 Saved prompt profiles with reusable templates and variables
- ⚡ Response cache with history replay
- 💰 Cost and token analytics across providers
- 💬 Multi-turn chat threads with context memory
- 📊 Per-model input/output pricing rules
- 🧠 Automatic chat context compression with summaries
- 🧱 35 capability toggles for enterprise-grade control
- 🔗 Integrations hub (webhook, Slack, Telegram, Git providers, Jira, Notion, Teams, PagerDuty)
- 🧭 Smart router control plane (cost/speed/reliability/balanced)
- 🛡️ Guardrails with blocklist and regex redaction
- 🧪 Built-in response evaluation harness
- 💳 Budget governance (daily/monthly/per-request)
- 🕒 Scheduler with `cron`, `every`, and `at` job types
- ❤️ Heartbeat engine for periodic autonomous runs
- 🪝 Event hooks for lifecycle and platform events
- 📋 Standing orders for persistent behavior constraints
- 🔄 Task Flow orchestration for multi-step durable runs
- 🧾 Background task ledger with audit, cancellation, notify policy, and maintenance sweep
- 🩺 Deep runtime status module (`status --deep`) with aggregated health snapshot
- 🚨 Alerts module for active operational findings (`alerts`)
- 📟 Incidents registry with acknowledge/resolve workflow (`incidents`)
- 🛠️ Maintenance windows with alert/incident silencing controls (`maintenance-windows`)
- 🚦 Escalation rules with cooldown and auto-incident policy (`escalations`)
- 🌐 Web dashboard for configuration
- 🤖 Integrations with communication platforms:
  - Discord
- 🤖 AI Platforms:
  - OpenAI
  - Claude
  - Ollama
- 🔐 Secure API key management
- 📡 Self-hosted OpenOKAPI server

---

## 🌐 Gateway API

OpenOKAPI includes a built-in HTTP/WebSocket API server that provides remote access to all AI integrations.

### Features:

- 🔒 **Secure Authentication** - API key validation and User-Agent verification
- 🚀 **RESTful API** - Mirror of all CLI commands as HTTP endpoints
- 🔌 **WebSocket Support** - Real-time bidirectional communication
- 📚 **Request History** - Local audit trail with recent activity and summary stats
- ⚙️ **Configurable** - Custom port via environment variable (default: 16273)

### Quick Start:

```bash
# Generate API key
openokapi generate api-key

# Start Gateway server
openokapi gateway

# Or specify custom port
openokapi gateway --port 8080

# Show local request history
openokapi history --stats --limit 10

# Optional: set fallback provider for failover
openokapi config --set-fallback claude

# Run batch requests from JSON file
openokapi batch --file ./requests.json --concurrency 4
```

Open the built-in panel at `http://localhost:16273/panel` after starting gateway.

Automation reference: see `docs/AUTOMATION.md`.

### Available Endpoints:

**Claude:**

- `GET /api/claude/status` - Get configuration status
- `POST /api/claude/ask` - Send prompt (body: `{prompt, model?}`)
- `POST /api/claude/stream` - Stream response as SSE (body: `{prompt, model?}`)

**OpenAI:**

- `GET /api/openai/status` - Get configuration status
- `POST /api/openai/ask` - Send prompt (body: `{prompt, model?}`)
- `POST /api/openai/stream` - Stream response as SSE (body: `{prompt, model?}`)

**Ollama:**

- `GET /api/ollama/status` - Get configuration status
- `GET /api/ollama/list` - List all models
- `GET /api/ollama/search?query=...` - Search models
- `GET /api/ollama/info?model=...` - Get model info
- `POST /api/ollama/ask` - Send prompt (body: `{prompt, model?}`)
- `POST /api/ollama/stream` - Stream response as SSE (body: `{prompt, model?}`)
- `POST /api/ollama/pull` - Pull model (body: `{model}`)
- `DELETE /api/ollama/delete` - Delete model (body: `{model}`)

**Batch + Panel:**

- `POST /api/batch` - Process many requests with concurrency control (body: `{requests, concurrency?}`)
- `GET /api/profiles` - List saved prompt profiles
- `POST /api/profiles` - Create or update a profile
- `POST /api/profiles/:name/run` - Execute a saved profile
- `DELETE /api/profiles/:name` - Remove a profile
- `GET /panel` - Browser panel with API key login, chat, stream mode, batch runner, and history view

**History:**

- `GET /api/history/summary` - Get aggregated request stats
- `GET /api/history/recent?limit=...` - Get recent requests, optionally filtered by `provider`, `source`, or `action`
- `POST /api/history/replay/:id` - Replay a cached response from a history entry
- `DELETE /api/history` - Clear local request history

**Cache + Costs + Chat:**

- `GET /api/cache/stats` - Show response cache usage
- `POST /api/cache/config` - Update cache settings (global and per-provider, including model exclusions)
- `DELETE /api/cache` - Clear response cache
- `GET /api/costs/summary?days=...` - Cost and token summary
- `GET /api/pricing` - List pricing rules (optionally filtered by provider)
- `POST /api/pricing/rule` - Upsert pricing rule with separate input/output rates
- `DELETE /api/pricing/rule?provider=...&match=...` - Delete pricing rule
- `GET /api/chat` - List chat conversations
- `POST /api/chat/start` - Start a new conversation (`provider`, optional `model`, `title`, `system`)
- `GET /api/chat/:id` - Get one conversation
- `POST /api/chat/:id/message` - Send message with context memory
- `POST /api/chat/:id/summarize` - Force context compression summary
- `DELETE /api/chat/:id` - Delete conversation

**Advanced Control Plane:**

- `GET /api/capabilities` - Show 35 capability flags
- `POST /api/capabilities/:key` - Enable/disable specific capability
- `GET /api/integrations` - List integrations
- `POST /api/integrations` - Upsert integration configuration
- `DELETE /api/integrations/:id` - Remove integration
- `POST /api/integrations/dispatch` - Dispatch event to enabled integrations
- `GET /api/integrations/dlq` - List integration dead-letter queue entries
- `POST /api/integrations/dlq/:id/retry` - Retry one DLQ integration delivery
- `DELETE /api/integrations/dlq/:id` - Delete one DLQ entry
- `DELETE /api/integrations/dlq` - Clear all DLQ entries
- `GET /api/router/policy` - Read smart routing policy
- `POST /api/router/policy` - Update routing policy
- `GET /api/router/pick` - Show current provider pick
- `GET /api/router/explain` - Show routing scores and filtering reasons
- `POST /api/router/execute` - Execute prompt through smart router
- `GET /api/guardrails/config` - Read guardrails config
- `POST /api/guardrails/config` - Update guardrails config
- `POST /api/guardrails/scan` - Check/redact text with guardrails
- `POST /api/evals/score` - Evaluate prompt/response pair
- `GET /api/budget/config` - Read budget config
- `POST /api/budget/config` - Update budget config
- `GET /api/budget/status` - Current budget usage and block status
- `POST /api/budget/preflight` - Check whether estimated request cost is allowed

**Automation and Tasks:**

- `GET /api/automations` - List automation rules
- `POST /api/automations` - Create/update automation rule
- `POST /api/automations/simulate` - Simulate automation event execution
- `DELETE /api/automations/:id` - Delete automation rule
- `GET /api/scheduler` - List scheduler jobs and runtime status
- `POST /api/scheduler` - Create/update scheduler job
- `POST /api/scheduler/:id/run` - Run scheduler job immediately
- `DELETE /api/scheduler/:id` - Delete scheduler job
- `GET /api/heartbeat` - Heartbeat config and runtime status
- `POST /api/heartbeat` - Update heartbeat config and reload engine
- `POST /api/heartbeat/run` - Execute heartbeat immediately
- `GET /api/hooks` - List hooks
- `POST /api/hooks` - Create/update hook
- `POST /api/hooks/simulate` - Simulate hook event
- `DELETE /api/hooks/:id` - Delete hook
- `GET /api/standing-orders` - List standing orders
- `POST /api/standing-orders` - Create/update standing order
- `DELETE /api/standing-orders/:id` - Delete standing order
- `GET /api/task-flow` - List task flows
- `GET /api/task-flow/:lookup` - Get flow by id or name lookup
- `POST /api/task-flow/:lookup/run` - Run flow by lookup
- `POST /api/task-flow/:lookup/cancel` - Cancel flow by lookup
- `GET /api/task-flow/audit` - Audit task flow registry health
- `POST /api/task-flow/maintenance` - Run flow maintenance (dry-run or apply)
- `GET /api/task-flow/maintenance/status` - Task flow maintenance sweeper status
- `GET /api/tasks` - List background tasks (supports filters: `status`, `kind`, `notifyPolicy`, `limit`)
- `GET /api/tasks/:lookup` - Get task by id/run/session/flow lookup
- `POST /api/tasks/:lookup/cancel` - Cancel background task
- `POST /api/tasks/:lookup/notify` - Update notify policy (`done_only|state_changes|silent`)
- `GET /api/tasks/audit` - Audit task ledger health
- `POST /api/tasks/maintenance` - Run maintenance (dry-run or apply)
- `GET /api/tasks/maintenance/status` - Maintenance sweeper status
- `GET /api/tasks/flow` - Alias list endpoint for task flows
- `GET /api/tasks/flow/:lookup` - Alias get endpoint for task flow lookup
- `POST /api/tasks/flow/:lookup/run` - Alias run endpoint for task flow lookup
- `POST /api/tasks/flow/:lookup/cancel` - Alias cancel endpoint for task flow lookup
- `GET /api/tasks/flow/audit` - Alias flow audit endpoint
- `POST /api/tasks/flow/maintenance` - Alias flow maintenance endpoint
- `GET /api/tasks/flow/maintenance/status` - Alias flow maintenance status endpoint
- `GET /api/doctor` - Aggregated automation health and findings
- `POST /api/doctor/repair` - Run doctor with maintenance repair actions
- `GET /api/backup` - List available config snapshots
- `POST /api/backup/create` - Create snapshot of local OpenOKAPI state
- `GET /api/backup/:id/verify` - Verify snapshot integrity (checksum + size)
- `GET /api/reset/plan?scope=...` - Preview reset impact (`config|config+history|full`)
- `POST /api/reset/run` - Execute reset (or dry-run) for selected scope
- `GET /api/security/audit` - Run local security audit (use `?fix=true` to auto-fix permissions)
- `POST /api/security/audit` - Run security audit with JSON body (`{fix:true}`)
- `GET /api/system/self-test` - Run full self-test report
- `GET /api/status` - Runtime status summary (`?deep=true` adds doctor, security, and full self-test)
- `GET /api/alerts` - Active alert summary (`?limit=...`, `?deep=true`)
- `GET /api/incidents` - List incidents (`?status=open|acknowledged|resolved`, `?limit=...`)
- `POST /api/incidents` - Create incident from current alerts/status snapshot (`{forceWhenMuted:true}` bypasses maintenance mute)
- `GET /api/incidents/:id` - Get incident details
- `POST /api/incidents/:id/ack` - Acknowledge incident
- `POST /api/incidents/:id/resolve` - Resolve incident
- `GET /api/maintenance-windows` - List maintenance windows and active mute status
- `POST /api/maintenance-windows` - Create/update maintenance window (`name`, `startAt`, `endAt`, optional mute flags)
- `DELETE /api/maintenance-windows/:id` - Delete maintenance window
- `GET /api/maintenance-windows/status` - Show active maintenance mute state
- `GET /api/escalations` - List escalation rules
- `POST /api/escalations` - Create/update escalation rule
- `DELETE /api/escalations/:id` - Delete escalation rule
- `POST /api/escalations/run` - Evaluate escalation rules and dispatch configured integration events

### Automation CLI Quick Start

```bash
# Tasks
openokapi tasks list --status running
openokapi tasks show <lookup>
openokapi tasks audit
openokapi tasks maintenance --status

# Task Flow
openokapi tasks flow list --status running
openokapi tasks flow show <lookup>
openokapi tasks flow audit
openokapi tasks flow maintenance --status
openokapi tasks flow maintenance --apply --retention-days 14

# Scheduler / Heartbeat
openokapi automations --set --name "Auto escalate" --event request.error --actions '[{"type":"dispatchIntegration","event":"automation.error"}]'
openokapi automations --simulate --event request.error --payload '{"provider":"openai","success":false}'
openokapi scheduler --set --name "Morning report" --cron "0 9 * * *" --task-type prompt --provider openai --prompt "Generate report"
openokapi heartbeat --set --enabled true --interval-minutes 30 --provider openai --prompt "Check pending work"

# Doctor
openokapi doctor
openokapi doctor --repair --retention-days 14

# Backup
openokapi backup list
openokapi backup create
openokapi backup verify <backup-id>

# Reset
openokapi reset --scope config --dry-run
openokapi reset --scope config+history --yes

# Security
openokapi security --json
openokapi security --fix
openokapi self-test

# Status
openokapi status
openokapi status --deep --json

# Alerts
openokapi alerts
openokapi alerts --limit 20 --ignore-mute --json

# Incidents
openokapi incidents create --deep --force
openokapi incidents list --status open
openokapi incidents resolve <incident-id> --note "mitigated"
openokapi maintenance-windows --set --name "Deploy" --start-at 2026-01-01T10:00:00Z --end-at 2026-01-01T12:00:00Z --mute-alerts true --mute-incidents true
openokapi maintenance-windows --status --json
openokapi escalations --set --name "Critical errors" --trigger alerts.error --min-severity error --min-count 2 --integration-event escalation.critical --auto-incident true --cooldown-minutes 15
openokapi escalations --run --reason "manual check"
```

### Example Request:

```bash
curl -X POST http://localhost:16273/api/openai/ask \
  -H "Content-Type: application/json" \
  -H "User-Agent: OPENOKAPI/1.0" \
  -H "X-API-Key: your-api-key" \
  -d '{"prompt": "Hello, world!"}'
```

---

## 🤝 Contributing

OpenOKAPI is a community-driven project and we are looking for contributors!

We welcome anyone who:

- knows **TypeScript**
- wants to contribute to open-source
- has ideas for new features
- wants to help build the CLI, web panel, or integrations

Experience level doesn’t matter – what counts is motivation and willingness to help 💙

---

## 🚀 How to Join

If you’d like to contribute:

1. Fork the repository
2. Explore the documentation
3. Pick an issue to work on
4. Submit a pull request

Every contribution is appreciated – code, tests, documentation, ideas!

---

## 📬 Contact & Community

Join our Discord community and help build OpenOKAPI together:

💬 **Discord:** https://discord.gg/RF8CgZbx2P

Feel free to reach out, ask questions, or propose new ideas!

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=monderey/openokapi&type=Date)](https://star-history.com/#monderey/openokapi&Date)

## ❤️ Contributors

Thanks to everyone who helps make this project better!

<a href="https://github.com/monderey/openokapi/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=monderey/openokapi" />
</a>

---

### ✨ OpenOKAPI – AI for everyone!
