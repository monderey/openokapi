# Ollama Integration

Complete integration with Ollama local AI models for OpenOKAPI.

## Features

- ✅ **Model Management**: List, search, pull, and delete models
- ✅ **Chat Interface**: Send prompts to local Ollama models
- ✅ **Model Information**: Get detailed info about downloaded models
- ✅ **Rate Limiting**: Built-in protection against request abuse (30 req/min default)
- ✅ **Config Management**: Persistent configuration storage
- ✅ **Error Handling**: Comprehensive error messages and logging
- ✅ **Streaming Support**: Handle model pulling with progress tracking

## Installation

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Start Ollama service: `ollama serve` (default port 11434)
3. Configure OpenOKAPI with Ollama URL:
   ```bash
   openokapi agent ollama --seturl "http://localhost:11434"
   ```

## Quick Start

### 1. Set Ollama Server URL

```bash
openokapi agent ollama --seturl "http://localhost:11434"
```

Default URL is `http://localhost:11434` if Ollama runs locally.

### 2. Pull a Model

Pull an Ollama model (example: `llama2`):

```bash
openokapi agent ollama --pull llama2
```

Available models: https://ollama.ai/library

### 3. Set Default Model

```bash
openokapi agent ollama --setagent llama2
```

### 4. Ask Questions

```bash
openokapi agent ollama --ask "Explain quantum computing in simple terms"
```

## Commands Reference

### Configuration

#### Set Server URL

```bash
openokapi agent ollama --seturl <URL>
```

#### Set Default Model

```bash
openokapi agent ollama --setagent <MODEL_NAME>
```

#### Show Status

```bash
openokapi agent ollama --status
```

### Model Management

#### List All Models

```bash
openokapi agent ollama --list
```

Shows all downloaded models with their sizes, formats, and families.

#### Search Models

```bash
openokapi agent ollama --search "<SEARCH_TERM>"
```

Search by model name, family (e.g., "llama"), or format.

#### Pull New Model

```bash
openokapi agent ollama --pull <MODEL_NAME>
```

Download a model from Ollama registry with progress tracking.

#### Get Model Info

```bash
openokapi agent ollama --info <MODEL_NAME>
```

Display detailed information:

- Model name and identifier
- Size on disk
- Format and family
- Quantization level
- Last modified date

#### Delete Model

```bash
openokapi agent ollama --delete <MODEL_NAME>
```

Remove a model from the system.

### Interaction

#### Ask AI

```bash
openokapi agent ollama --ask "<PROMPT>"
```

Send prompt to the default model.

Options:

- Uses default model set with `--setagent`
- Falls back to `--model` parameter if provided

#### Rate Limit Status

```bash
openokapi agent ollama --rate-limit
```

Shows current rate limit status:

- Requests remaining
- Requests limit
- Next refill time

### Help

```bash
openokapi agent ollama --help
```

Display all available commands.

## Configuration File

Config is stored in `~/.openokapi/ollama.json`:

```json
{
  "baseURL": "http://localhost:11434",
  "enabled": true,
  "defaultModel": "llama2"
}
```

Models are cached in `~/.openokapi/ollama-models.json`.

## Popular Models

| Model       | Size   | Description            |
| ----------- | ------ | ---------------------- |
| llama2      | 3.8 GB | Meta's Llama 2 (7B)    |
| mistral     | 4.1 GB | Mistral 7B             |
| neural-chat | 4.1 GB | Intel Neural Chat 7B   |
| orca-mini   | 1.3 GB | Small, efficient model |
| phi         | 1.6 GB | Microsoft Phi          |
| starling-lm | 4.1 GB | Starling LM 7B         |

Get more at: https://ollama.ai/library

## Rate Limiting

Default: **30 requests per minute**

The rate limiter automatically:

- Throttles requests to respect limits
- Waits before making requests when limit reached
- Refills quota every minute
- Logs warnings when limits are exceeded

Adjust in code via:

```typescript
OllamaClient.configure({ requestsPerMinute: 60 });
```

## Error Handling

Common errors and solutions:

### "Could not connect to Ollama"

- Verify Ollama is running: `ollama serve`
- Check URL: `openokapi agent ollama --status`
- Ensure no firewall blocks port 11434

### "Model not found"

- Pull model first: `openokapi agent ollama --pull <model>`
- Check available models: `openokapi agent ollama --list`

### "Rate limit exceeded"

- Wait for limit to reset (1 minute)
- Reduce request frequency
- Increase rate limit in config if needed

## Architecture

### OllamaClient (`src/ollama/client.ts`)

Main client class with methods:

- `listModels()` - Get all models
- `modelExists(name)` - Check if model exists
- `searchModel(term)` - Search models
- `chat(request)` - Send chat message
- `generate(request)` - Generate completion
- `pullModel(name, onProgress)` - Download model
- `getModelInfo(name)` - Get model details
- `deleteModel(name)` - Remove model
- `embeddings(request)` - Get embeddings

### Rate Limiter (`src/ollama/utils/rate-limiter.ts`)

Token-based rate limiting with:

- Configurable requests per minute
- Automatic token refill
- `waitForSlot()` for blocking requests
- Status monitoring

### Configuration (`src/config/ollama.ts`)

Handles:

- Loading/saving config JSON
- Model cache management
- Model search functionality

### CLI Commands (`src/cli/commands/ollama/`)

Each command is a separate file:

- `help.ts` - Help message
- `seturl.ts` - Configure server URL
- `setagent.ts` - Set default model
- `ask.ts` - Send prompts
- `list.ts` - List models
- `search.ts` - Search models
- `pull.ts` - Download models
- `info.ts` - Get model info
- `delete.ts` - Remove models
- `status.ts` - Show configuration
- `rate-limit.ts` - Rate limit status

## API Endpoints Used

| Endpoint          | Method | Purpose             |
| ----------------- | ------ | ------------------- |
| `/api/tags`       | GET    | List models         |
| `/api/chat`       | POST   | Chat completion     |
| `/api/generate`   | POST   | Text generation     |
| `/api/embeddings` | POST   | Generate embeddings |
| `/api/pull`       | POST   | Download model      |
| `/api/delete`     | DELETE | Remove model        |
| `/api/copy`       | POST   | Copy model          |

See: https://github.com/ollama/ollama/blob/main/docs/api.md

## Development

### Type Definitions

Key types in `src/ollama/models/index.ts`:

- `OllamaChatRequest/Response` - Chat API
- `OllamaGenerateRequest/Response` - Generate API
- `OllamaModelInfo` - Model metadata
- `OllamaPullResponse` - Pull progress
- `RateLimitConfig` - Rate limit settings

### Extending OllamaClient

```typescript
import { OllamaClient } from "../ollama/client.js";

const client = new OllamaClient({
  baseURL: "http://localhost:11434",
  timeout: 60000,
  maxRetries: 3,
});

const response = await client.chat({
  model: "llama2",
  messages: [{ role: "user", content: "Hello!" }],
});
```

### Using sendOllamaRequest

```typescript
import { sendOllamaRequest } from "../functions/ollama-request.js";

const response = await sendOllamaRequest("llama2", "Explain AI", "generate");
```

## Troubleshooting

### Models not appearing after pull

- Run: `openokapi agent ollama --list`
- Status might be cached; refresh with the list command

### Slow responses

- Check system resources (RAM, CPU)
- Consider smaller models (orca-mini, phi)
- Increase timeout if needed

### High memory usage

- Unload unused models: `openokapi agent ollama --delete <model>`
- Use smaller quantized models
- Ollama runs one model at a time by default

## See Also

- [Ollama Official Docs](https://github.com/ollama/ollama)
- [Model Library](https://ollama.ai/library)
- [API Reference](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Local Development Guide](https://github.com/ollama/ollama/blob/main/docs/development.md)
