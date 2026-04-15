# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2026.4.15]

### Added

- **Extended control-plane modules and configs**:
  - New config modules: automations, hooks, scheduler, heartbeat, standing-orders, task-flow, tasks ledger, capabilities, cache, budget, guardrails, profiles, pricing, conversations, escalations
  - New runtime modules: status, self-test, doctor, alerts, incidents, maintenance windows, escalations, smart router, profile runner, automation engine, hooks engine, event bus, backup, reset, security audit, budget enforcer, conversation chat
  - New utility modules: response cache, pricing/cost helpers, template rendering

- **New CLI commands**:
  - `profile`, `cache`, `costs`, `replay`, `chat`, `pricing`, `capabilities`, `integrations`, `router`, `guardrails`, `eval`, `budget`, `automations`, `hooks`, `scheduler`, `self-test`, `standing-orders`, `task-flow`, `heartbeat`, `tasks`, `doctor`, `backup`, `reset`, `security`, `status`, `alerts`, `incidents`, `maintenance-windows`, `escalations`

- **Gateway/API expansion**:
  - New route families: cache, costs, pricing, profiles, chat, capabilities, integrations (incl. DLQ ops), router, guardrails, evals, budget, automations, hooks, scheduler, heartbeat, standing-orders, task-flow, tasks, doctor, backup, reset, security, status, alerts, incidents, maintenance-windows, escalations, system self-test

- **Operational features**:
  - Background task ledger with audit, maintenance, cancellation, and notify policies
  - Task flow orchestration with audit and retention maintenance
  - Scheduler engine with `cron`, `every`, and `at` scheduling modes
  - Heartbeat engine for periodic autonomous checks
  - Incidents + alerts model with maintenance mute logic
  - Escalation rules with cooldown and optional auto-incident creation
  - Backup snapshot creation and checksum verification
  - Reset planner/executor for scoped local state cleanup

- **Integration improvements**:
  - New `pagerduty` integration type support across config/CLI/routes
  - PagerDuty-specific payload mapping (`trigger`/`resolve`, severity mapping, dedup key handling)

### Changed

- **Maintenance-aware behavior**:
  - Alert reporting can bypass mute using `ignoreMute`
  - Incident creation supports forced mode during maintenance (`forceWhenMuted` / CLI `--force`)

- **Security and reset coverage**:
  - Security audit and reset scopes now include maintenance windows and escalations state files

### Documentation

- Updated main docs and localized docs (`README.md`, `docs/COMMANDS.md`, `lang/pl/README.md`, `lang/de/README.md`) to include:
  - New control-plane commands
  - Maintenance windows and escalations workflows
  - PagerDuty integration usage examples
  - Additional automation and diagnostics coverage

## [2026.4.14]

### Added

- **Request History System**:
  - New module `src/utils/request-history.ts` with local JSONL-based request logging
  - New CLI command: `openokapi history` with `--summary`, `--recent`, `--clear` options and filters (`--provider`, `--source`, `--action`)
  - New HTTP endpoints: `GET /api/history/summary`, `GET /api/history/recent`, `DELETE /api/history`
  - Request history persisted in `~/.openokapi/request-history.jsonl` with read-only file permissions (0600)
  - Automatic history tracking across CLI and API calls

- **Failover and Batch Processing**:
  - New failover execution layer in `src/functions/failover.ts` for automatic provider fallback
  - New CLI command: `openokapi batch` with `--file` and `--concurrency` options for batch request processing
  - New HTTP endpoint: `POST /api/batch` for concurrent multi-provider requests
  - Configurable fallback provider via `openokapi config --set-fallback`

- **Streaming Endpoints**:
  - New `POST /api/claude/stream`, `POST /api/openai/stream`, `POST /api/ollama/stream` endpoints with SSE (Server-Sent Events)
  - Real-time response streaming across all AI providers

- **Web Panel UI**:
  - Full-featured web panel served at `GET /panel` with in-browser HTML/CSS/JS
  - API key login with localStorage session persistence
  - Chat interface with provider/model selection
  - Streaming mode toggle and manual ask/stream endpoints
  - Batch request runner with JSON payload input and concurrency control
  - History viewer with recent requests filtering
  - Responsive design with mobile drawer menu and adaptive layout
  - Panel client authenticated via `X-OpenOKAPI-Client: web-panel` header

- **Web Panel UI/UX Refinements**:
  - Removed Stream checkbox from navbar (always uses streaming by default)
  - Reduced composer action button sizes: 36x36px (desktop), 34x34px (tablet), 32x32px (mobile)
  - Reduced button SVG icons to 16x16px for better proportions
  - Changed user message bubble background to match composer (#2b2b2f) for visual cohesion
  - Reduced composer input font size: 15px (desktop), 13px (mobile/tablet) for subtler appearance
  - Removed border and padding from provider/model selector container for cleaner layout
  - Improved responsive breakpoint alignment (979px for mobile drawer trigger)
  - Ensured consistent button layout (Clear chat left, Send right) across all device sizes

### Changed

- **Security Hardening**:
  - Enhanced API key validation with User-Agent verification in gateway middleware
  - Config file permissions updated to 0600 (read-only by owner) for API keys and history
  - Config directory permissions set to 0700 (secure directory access)
  - Improved error messages to avoid leaking sensitive provider information in CLI/API responses

- **provider Routes (OpenAI, Claude, Ollama)**:
  - Integrated failover logic for automatic fallback between providers
  - Enhanced streaming response handling with specific error messages (e.g., rate limit detection)
  - Added request metadata tracking (provider used, fallback status)

- **CLI Commands**:
  - Updated `ask` commands across all providers (OpenAI, Claude, Ollama) to support failover
  - Improved error handling and user feedback in CLI output

- **Documentation**:
  - Updated `README.md` with complete Gateway API section including streaming, batch, and history
  - Updated Polish translation (`lang/pl/README.md`) with Gateway API details
  - Updated German translation (`lang/de/README.md`) with Gateway API details
  - Updated `docs/COMMANDS.md` with new CLI commands (history, batch, set-fallback)

### Fixed

- Fixed CLI build packaging path issues for filesystems with spaces
- Fixed global CLI wrapper path resolution for consistent installation
- Improved OpenAI stream error handling to detect and report specific errors (rate limits, auth failures) instead of generic messages
- Stabilized TypeScript strict mode (`exactOptionalPropertyTypes`) across all endpoint implementations
- Fixed concurrent batch request handling edge cases

## [2026.2.7]

### Added

- Complete Ollama integration for local AI models
- New agent: Ollama (openokapi agent ollama)
- New CLI commands for Ollama:
  - `--seturl` - sets Ollama base URL (default: http://localhost:11434)
  - `--ask` (optional: `--model`) - send a prompt to Ollama model
  - `--setagent` - sets the default Ollama model to use
  - `--list` - lists all downloaded models
  - `--search` - searches for models by name or family
  - `--pull` - downloads a model from Ollama registry
  - `--info` - gets detailed information about a specific model
  - `--delete` - removes a model from local storage
  - `--status` - shows Ollama configuration and connection status
  - `--rate-limit` - displays current rate limit status
  - `--help` - shows all Ollama commands
- New Ollama client (`OllamaClient`) with full API support:
  - Chat completions (`chat`)
  - Text generation (`generate`)
  - Model management (list, pull, delete, copy)
  - Model information and search
  - Embeddings generation
- New configuration files: `~/.openokapi/ollama.json`, `~/.openokapi/ollama-models.json`
- Ollama-specific rate limiter with configurable requests per minute (default: 30/min)
- Model existence validation before sending requests
- Model search functionality to find models by name or family
- Request helper function: `sendOllamaRequest` in functions module
- Full error handling and logging for Ollama operations
- Support for streaming responses during model downloads with progress tracking
- **Gateway API Server** - HTTP/WebSocket API server for remote access to OpenOKAPI
- New CLI command: `openokapi gateway` (optional: `--port`) - starts the Gateway API server
- Gateway API security features:
  - API key authentication using keys generated by `openokapi generate api-key`
  - User-Agent validation (requires `OPENOKAPI/1.0`)
  - Configurable port via `GATEWAY_PORT` environment variable (default: 16273)
- Gateway API endpoints mirroring CLI commands:
  - **Claude**: `GET /api/claude/status`, `POST /api/claude/ask`
  - **OpenAI**: `GET /api/openai/status`, `POST /api/openai/ask`
  - **Ollama**: `GET /api/ollama/status`, `GET /api/ollama/list`, `GET /api/ollama/search`, `GET /api/ollama/info`, `POST /api/ollama/ask`, `POST /api/ollama/pull`, `DELETE /api/ollama/delete`
- WebSocket support on Gateway server for real-time communication
- Gateway middleware for request validation and authentication
- New environment variable: `GATEWAY_PORT` in `.env.example` for port configuration
- New CLI command: `openokapi config --set-user-agent` - sets custom User-Agent header for Gateway API (default: `OPENOKAPI/1.0`)
- Custom User-Agent support in app configuration file: `~/.openokapi/openokapi.json`
- User-Agent validation in Gateway middleware using configured value

### Changed

- Extended config paths module to include Ollama configuration paths
- Enhanced config module structure to support local model management alongside cloud APIs

### Fixed

- Proper validation of model availability before executing requests
- Consistent error messaging across all Ollama CLI commands

## [2026.2.5]

### Added

- Integration via API key to Claude AI (Anthropic)
- New agent: Claude (openokapi agent claude)
- New commands CLI for Claude:
  - `--ask` (optional: `--model`) - send a request to Claude agent
  - `--help` - all Claude commands
  - `--setagent` - sets the available AI model in Claude
  - `--setkey` - sets Claude API key
  - `--status` - shows the current Claude integration setting
  - `--update-models` - updates models to current Claude models
  - `--rate-limit` - shows current Claude API rate limit status
- Claude configuration to onboard interface
- Rate limiting system for Claude API with header-based tracking
- Comprehensive error handling for Claude API responses
- API key validation system for Claude with model availability checks
- New configuration files: `~/.openokapi/claude.json`, `~/.openokapi/claude-models.json`
- Full Claude client implementation with retry logic and timeout handling
- Discord bot `/ask` command now supports both OpenAI and Claude providers
- New `provider` option in `/ask` command to choose between OpenAI and Claude
- Auto-detection of available AI providers based on configured API keys
- Public package exports in src entrypoint for clients, configs, and request helpers
- OpenAI/Claude version helpers: `getOpenAIVersionInfo`, `getClaudeVersionInfo` with API constants
- New CLI command: `openokapi generate api-key` to generate a UUID API key (overwrites previous key)
- New CLI command: `openokapi config --show api-key` to display the stored API key
- New app config file: `~/.openokapi/openokapi.json` for generated API key storage

### Changed

- CLI text wrapping now preserves dim box borders when displaying colored text
- Extended message validation to support Claude's text block format
- Discord `/ask` command description updated to reflect support for both AI providers
- Discord `/ask` embed now displays provider name and uses different colors/icons for OpenAI (🤖 green) and Claude (🧠 orange)
- Claude rate limiter default limits lowered to 5 requests/minute and 40,000 tokens/minute (free tier compatible)
- Claude rate limits now auto-update from API response headers during validation and requests

### Fixed

- Fixed CLI box border colors bleeding through when wrapping colored text lines
- Fixed Claude API validation to use proper message format (text blocks instead of plain strings)
- Fixed 400 error during Claude API key validation by implementing correct request structure

## [2026.2.4]

### Added

- Discord bot headless mode support
- New command: `--headless` flag for `--status on` to run bot in background mode
- New command: `--foreground` to attach to headless bot logs without restarting
- New command: `--help` for Discord agent commands
- Log file support for headless mode (`~/.openokapi/discord.log`)
- Console output capturing and logging in headless mode

### Changed

- Discord bot `--status on` now supports two modes:
  - Without `--headless`: runs bot with visible console (foreground mode)
  - With `--headless`: runs bot in background with logs saved to file
- `--foreground` command behavior changed: now attaches to existing headless bot logs instead of starting new instance
- Improved bot lifecycle management: config updates only after successful operations
- Refactored `--foreground` command into modular file structure (`src/cli/commands/discord/foreground.ts`)

### Fixed

- Fixed issue where bot couldn't be stopped when already running
- Fixed config update timing to prevent inconsistent state
- Fixed log file creation and cleanup on bot exit in headless mode

## [2026.2.3]

### Added

- Integration via API key to OpenAI

New commands cli:

- Discord (openokapi agent discord):
  - --foreground - console log
- OpenAI (openokapi agent openai):
  - --ask (optional: --model) - send a request to the agent
  - --help - all openai commands
  - --rate-limit - shows current API key usage
  - --setagent - sets the available AI model in OpenAI
  - --setkey - sets api key
  - --status - shows the current OpenAI integration setting
  - --update-models - updates models to current openai models (without this you won't be able to use the agent setting)

Other changes:

- Added the ability to configure an API key for OpenAI to the onboard interface.
- Added a slash command for the Discord bot /ask <prompt> (available only for OpenAI)
