# Automation and Tasks

This document covers OpenOKAPI automation features inspired by OpenClaw parity work.

## Components

- Scheduler jobs: recurring (`cron`), interval (`every`), and one-shot (`at`) jobs.
- Heartbeat: periodic autonomous runs in the main runtime.
- Hooks: event-driven actions.
- Standing orders: persistent behavior instructions.
- Task flow: durable multi-step orchestration.
- Background tasks ledger: detached work records, audit, maintenance, notify policies.

## CLI Quick Reference

### Tasks

```bash
openokapi tasks list [--limit N] [--status queued|running|completed|failed|canceled] [--kind scheduler|task-flow|heartbeat|manual] [--notify-policy done_only|state_changes|silent] [--json]
openokapi tasks show <lookup> [--json]
openokapi tasks cancel <lookup>
openokapi tasks notify <lookup> <done_only|state_changes|silent>
openokapi tasks audit [--json]
openokapi tasks maintenance [--status] [--apply] [--retention-days N] [--json]
```

Task lookup supports task IDs and selected metadata tokens (`runId`, `sessionKey`, `childSessionKey`, `flowId`, `jobId`).

### Task Flow

```bash
openokapi tasks flow list [--status idle|running|completed|failed|canceled] [--json]
openokapi tasks flow show <lookup> [--json]
openokapi tasks flow cancel <lookup> [--json]
openokapi tasks flow audit [--json]
openokapi tasks flow maintenance [--status] [--apply] [--retention-days N] [--json]
```

Flow lookup supports ID and flow name.

### Scheduler

```bash
openokapi scheduler --set --name "Morning report" --cron "0 9 * * *" --task-type prompt --provider openai --prompt "Generate daily report"
openokapi scheduler --set --name "Follow up" --schedule-kind every --every-ms 1800000 --task-type prompt --provider claude --prompt "Check updates"
openokapi scheduler --set --name "Reminder" --schedule-kind at --at "2026-04-14T15:00:00Z" --task-type prompt --provider openai --prompt "Send reminder"
openokapi scheduler --run --id <job-id>
```

### Heartbeat

```bash
openokapi heartbeat --set --enabled true --interval-minutes 30 --provider openai --prompt "Check pending work"
openokapi heartbeat --run
openokapi heartbeat --reload
```

### Hooks

```bash
openokapi hooks --set --name on-task-complete --event taskflow.completed --actions '[{"type":"emit_event","event":"ops.notify"}]'
openokapi hooks --simulate --event scheduler.job.success --payload '{"jobId":"..."}'
openokapi hooks --delete --id <hook-id>
```

### Standing Orders

```bash
openokapi standing-orders --set --scope global --name compliance --content "Always include compliance checklist in final output."
openokapi standing-orders --preview
```

### Doctor

```bash
openokapi doctor [--json]
openokapi doctor --repair [--retention-days N] [--json]
```

Doctor aggregates task/task-flow audits and runtime status from scheduler and heartbeat.

### Backup

```bash
openokapi backup list [--limit N] [--json]
openokapi backup create [--json]
openokapi backup verify <backup-id> [--json]
```

Backup creates immutable snapshots from local OpenOKAPI config state and verifies entry integrity by size and SHA-256.

### Reset

```bash
openokapi reset --scope config --dry-run
openokapi reset --scope config+history --yes
openokapi reset --scope full --yes
```

Reset supports safety-first preview (`--dry-run`). Apply mode requires explicit confirmation via `--yes`.

### Security

```bash
openokapi security [audit] [--json]
openokapi security --fix [--json]
```

Security audit checks config/key presence and local file permission hardening. `--fix` applies safe chmod fixes.

### Status

```bash
openokapi status
openokapi status --deep [--json]
```

Status provides an operational runtime snapshot. `--deep` includes full self-test checks and aggregated doctor/security findings.

### Alerts

```bash
openokapi alerts [--limit N] [--json]
openokapi alerts --deep [--json]
```

Alerts aggregates active findings from self-test, doctor, and security reports.

### Incidents

```bash
openokapi incidents list [--status open|acknowledged|resolved] [--limit N] [--json]
openokapi incidents create [--title "..."] [--deep] [--limit N] [--json]
openokapi incidents show <incident-id> [--json]
openokapi incidents ack <incident-id> [--note "..."] [--json]
openokapi incidents resolve <incident-id> [--note "..."] [--json]
```

Incidents persist alert snapshots for triage and acknowledgment/resolve workflow.

## API Endpoints

### Task Ledger

- `GET /api/tasks`
- `GET /api/tasks?status=running&kind=scheduler&json=true`
- `GET /api/tasks/:lookup`
- `POST /api/tasks/:lookup/cancel`
- `POST /api/tasks/:lookup/notify` (`policy`: `done_only|state_changes|silent`)
- `GET /api/tasks/audit`
- `POST /api/tasks/maintenance`
- `GET /api/tasks/maintenance/status`

### Task Flow

- `GET /api/task-flow`
- `GET /api/task-flow/:lookup`
- `POST /api/task-flow`
- `POST /api/task-flow/:lookup/run`
- `POST /api/task-flow/:lookup/cancel`
- `GET /api/task-flow/audit`
- `POST /api/task-flow/maintenance`
- `GET /api/task-flow/maintenance/status`
- `DELETE /api/task-flow/:lookup`

Task-flow alias endpoints under tasks:

- `GET /api/tasks/flow`
- `GET /api/tasks/flow/:lookup`
- `POST /api/tasks/flow/:lookup/run`
- `POST /api/tasks/flow/:lookup/cancel`
- `GET /api/tasks/flow/audit`
- `POST /api/tasks/flow/maintenance`
- `GET /api/tasks/flow/maintenance/status`

### Related

- `GET/POST /api/scheduler`
- `GET/POST /api/heartbeat`
- `GET/POST /api/hooks`
- `GET/POST /api/standing-orders`
- `GET /api/doctor`
- `POST /api/doctor/repair`
- `GET /api/backup`
- `POST /api/backup/create`
- `GET /api/backup/:id/verify`
- `GET /api/reset/plan?scope=...`
- `POST /api/reset/run`
- `GET /api/security/audit`
- `POST /api/security/audit`
- `GET /api/status`
- `GET /api/alerts`
- `GET /api/incidents`
- `POST /api/incidents`
- `GET /api/incidents/:id`
- `POST /api/incidents/:id/ack`
- `POST /api/incidents/:id/resolve`

## Operational Notes

- Tasks and flows are persisted under the local OpenOKAPI config directory.
- A maintenance sweeper runs with gateway lifecycle and prunes terminal tasks by retention policy.
- Notify policy controls `tasks.notification` event emission:
  - `done_only`: notify on completion only.
  - `state_changes`: notify on running/completed/failed/canceled transitions.
  - `silent`: no task notification events.
