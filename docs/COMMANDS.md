# OpenOKAPI Commands

Below is the complete list of CLI commands and Discord commands, grouped by category, with descriptions and option variants.

## CLI — General Commands

### Help

```
openokapi help
```

Shows help and the list of basic commands.

### Version

```
openokapi version
```

Shows the tool version.

### Onboard

```
openokapi onboard
```

Runs interactive configuration (OpenAI/Claude/Discord).

### Generate API key

```
openokapi generate api-key
```

Generates a new UUID API key and stores it in the config. Each run overwrites the previous key.

### Show API key

```
openokapi config --show api-key
```

Displays the stored API key from the local config.

### Set fallback provider

```
openokapi config --set-fallback <openai|claude|ollama|off>
```

Sets the provider used as fallback when primary provider fails due to timeout/network/rate-limit errors.

### Run batch requests

```
openokapi batch --file <PATH> [--concurrency <N>]
```

Executes many provider prompts through gateway `/api/batch` endpoint.

Batch file format:

```json
[
  { "provider": "openai", "prompt": "hello", "model": "gpt-4o-mini" },
  { "provider": "claude", "prompt": "summarize this" },
  { "provider": "ollama", "prompt": "explain", "model": "llama3" }
]
```

### Request history

```
openokapi history
```

Shows recent provider requests with a compact stats summary.

Useful flags:

- `--show` - Show the default summary and recent entries
- `--stats` - Force the aggregated stats block
- `--limit <N>` - Limit recent entries shown (max 100)
- `--provider <openai|claude|ollama>` - Filter by provider
- `--source <cli|gateway|discord>` - Filter by source
- `--action <ask|chat|generate|stream>` - Filter by action
- `--clear` - Clear the local request history

## CLI — Gateway API Server

### Start Gateway

```
openokapi gateway
```

Starts the HTTP/WebSocket API server on the default port (16273) or port specified in `GATEWAY_PORT` environment variable.

### Start Gateway with custom port

```
openokapi gateway --port <PORT>
```

Starts the Gateway API server on a specific port.

**Requirements:**

- API key must be generated first using `openokapi generate api-key`
- All API requests require:
  - Header: `User-Agent: OPENOKAPI/1.0`
  - Header: `X-API-Key: <your-generated-key>`

**History:**

- `GET /api/history/summary` - Get aggregated request stats
- `GET /api/history/recent?limit=<N>` - Get recent request entries
- `DELETE /api/history` - Clear local request history

**Panel:**

- `GET /panel` - Open web panel with API-key login, chat, streaming mode, batch runner, and history controls

**Available Endpoints:**

**Claude:**

- `GET /api/claude/status` - Get Claude configuration status
- `POST /api/claude/ask` - Send prompt to Claude (body: `{prompt, model?}`)
- `POST /api/claude/stream` - Stream Claude response via SSE (body: `{prompt, model?}`)

**OpenAI:**

- `GET /api/openai/status` - Get OpenAI configuration status
- `POST /api/openai/ask` - Send prompt to OpenAI (body: `{prompt, model?}`)
- `POST /api/openai/stream` - Stream OpenAI response via SSE (body: `{prompt, model?}`)

**Ollama:**

- `GET /api/ollama/status` - Get Ollama configuration status
- `GET /api/ollama/list` - List all downloaded models
- `GET /api/ollama/search?query=<term>` - Search for models
- `GET /api/ollama/info?model=<name>` - Get model information
- `POST /api/ollama/ask` - Send prompt to Ollama (body: `{prompt, model?}`)
- `POST /api/ollama/stream` - Stream Ollama response via SSE (body: `{prompt, model?}`)
- `POST /api/ollama/pull` - Download a model (body: `{model}`)
- `DELETE /api/ollama/delete` - Delete a model (body: `{model}`)

**Batch:**

- `POST /api/batch` - Execute multiple provider requests in one call with configurable concurrency

**Example:**

```bash
curl -X POST http://localhost:16273/api/openai/ask \
  -H "Content-Type: application/json" \
  -H "User-Agent: OPENOKAPI/1.0" \
  -H "X-API-Key: your-api-key" \
  -d '{"prompt": "Hello, world!"}'
```

## CLI — OpenAI Agent

### Help

```
openokapi agent openai --help
```

Shows the list of OpenAI agent commands.

### Set API key

```
openokapi agent openai --setkey <KEY>
```

Sets the OpenAI API key and validates it.

### Set default model

```
openokapi agent openai --setagent <MODEL>
```

Sets the default OpenAI model (agent) used by `--ask`.

### Ask a question

```
openokapi agent openai --ask "<PROMPT>"
```

Sends a prompt to OpenAI using the default model.

### Status

```
openokapi agent openai --status
```

Shows OpenAI configuration status, including API key and default model info.

### Update models

```
openokapi agent openai --update-models
```

Fetches available OpenAI models and saves them to cache.

### Rate limit

```
openokapi agent openai --rate-limit
```

Shows current OpenAI API rate-limit status.

## CLI — Claude Agent

### Help

```
openokapi agent claude --help
```

Shows the list of Claude agent commands.

### Set API key

```
openokapi agent claude --setkey <KEY>
```

Sets the Claude API key and validates it.

### Set default model

```
openokapi agent claude --setagent <MODEL>
```

Sets the default Claude model (agent) used by `--ask`.

### Ask a question

```
openokapi agent claude --ask "<PROMPT>"
```

Sends a prompt to Claude using the default model.

### Status

```
openokapi agent claude --status
```

Shows Claude configuration status, including API key and default model info.

### Update models

```
openokapi agent claude --update-models
```

Fetches available Claude models and saves them to cache.

### Rate limit

```
openokapi agent claude --rate-limit
```

Shows current Claude API rate-limit status.

## CLI — Ollama Agent

### Help

```
openokapi agent ollama --help
```

Shows the list of Ollama agent commands.

### Set Ollama URL

```
openokapi agent ollama --seturl <URL>
```

Sets the Ollama server base URL (default: `http://localhost:11434`).

### Set default model

```
openokapi agent ollama --setagent <MODEL>
```

Sets the default Ollama model (agent) used by `--ask`.

### Ask a question

```
openokapi agent ollama --ask "<PROMPT>"
```

Sends a prompt to Ollama using the default model.

### List models

```
openokapi agent ollama --list
```

Shows all available/downloaded models on the Ollama server.

### Search models

```
openokapi agent ollama --search "<TERM>"
```

Searches for models by name, family, or format. Returns local models matching the search term.

### Pull model

```
openokapi agent ollama --pull <MODEL_NAME>
```

Downloads a new model from the Ollama registry and saves it locally. Shows download progress.

### Get model info

```
openokapi agent ollama --info <MODEL_NAME>
```

Shows detailed information about a model including size, format, family, and quantization level.

### Delete model

```
openokapi agent ollama --delete <MODEL_NAME>
```

Removes a model from the local Ollama installation.

### Status

```
openokapi agent ollama --status
```

Shows Ollama configuration status, including server URL, default model, and available models count.

### Rate limit

```
openokapi agent ollama --rate-limit
```

Shows current Ollama API rate-limit status (requests per minute).

## CLI — Discord Agent

### Help

```
openokapi agent discord --help
```

Shows the list of Discord agent commands.

### Set token

```
openokapi agent discord --settoken <TOKEN>
```

Sets the Discord bot token and validates it.

### Status (on/off)

```
openokapi agent discord --status on|off [--headless]
```

Turns the bot on or off. The `--headless` option runs the bot in the background (logs to a file).

### Foreground logs

```
openokapi agent discord --foreground
```

Attaches to the logs of a bot running in `--headless` mode.

### Version

```
openokapi agent discord --version
```

Shows the Discord integration version and API endpoint in use.

## Discord — Slash Commands

### Ask

```
/ask
```

Ask AI a question (OpenAI or Claude).

Options:

- `provider` (required): `openai` or `claude`
- `prompt` (required): your question
- `model` (optional): model to use
- `temperature` (optional): response creativity (0–2 for OpenAI, 0–1 for Claude, default 0.7)

### New session

```
/new
```

Creates a new conversation/session.

### Status

```
/status
```

Shows bot status. Optionally sets presence text.

Options:

- `text` (optional): new bot status text (admin only)

### Usage

```
/usage
```

Enables or disables usage tracking.

Options:

- `mode` (required): `on` or `off` (admin only)

### Restart

```
/restart
```

Restarts the bot (admin only).

### Version

```
/version
```

Shows the Discord integration version and API endpoint in use.
