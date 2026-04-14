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
- `GET /panel` - Browser panel with API key login, chat, stream mode, batch runner, and history view

**History:**

- `GET /api/history/summary` - Get aggregated request stats
- `GET /api/history/recent?limit=...` - Get recent requests, optionally filtered by `provider`, `source`, or `action`
- `DELETE /api/history` - Clear local request history

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
