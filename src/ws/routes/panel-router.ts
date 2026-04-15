import { Router } from "express";
import type { Request, Response } from "express";

const router: Router = Router();

const panelHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OpenOKAPI Panel</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --bg: #f7f7f8;
        --panel: #ffffff;
        --muted-panel: #f1f1f3;
        --line: #e5e7eb;
        --text: #0f172a;
        --text-soft: #64748b;
        --primary: #111111;
        --primary-soft: #1f2937;
        --danger: #b42318;
        --danger-bg: #fee4e2;
        --ok-bg: #ecfdf3;
        --ok-text: #027a48;
        --sidebar-bg: #171717;
        --sidebar-text: #f5f5f5;
        --sidebar-muted: #a3a3a3;
        --sidebar-line: #2a2a2a;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Manrope", sans-serif;
        color: var(--text);
        background: radial-gradient(circle at top right, #e8edf7 0%, #f5f6f8 45%);
      }

      .mono {
        font-family: "IBM Plex Mono", monospace;
      }

      .hidden {
        display: none !important;
      }

      .auth-view {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }

      .auth-card {
        width: 100%;
        max-width: 560px;
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 28px;
        box-shadow: 0 20px 50px rgba(16, 24, 40, 0.08);
      }

      .auth-title {
        margin: 0;
        font-size: 30px;
        font-weight: 700;
      }

      .auth-subtitle {
        margin: 8px 0 0;
        color: var(--text-soft);
      }

      .auth-form {
        margin-top: 20px;
        display: grid;
        gap: 12px;
      }

      input,
      select,
      textarea,
      button {
        width: 100%;
        border-radius: 12px;
        border: 1px solid var(--line);
        background: #fff;
        color: var(--text);
        padding: 12px 14px;
        font-family: inherit;
        font-size: 14px;
      }

      input:focus,
      select:focus,
      textarea:focus {
        outline: 2px solid #d9deea;
        outline-offset: 0;
        border-color: #cfd5e3;
      }

      button {
        cursor: pointer;
        font-weight: 600;
      }

      .auth-actions {
        display: flex;
        gap: 10px;
      }

      .btn-dark {
        background: var(--primary);
        color: #fff;
        border: 0;
      }

      .btn-dark:hover {
        background: var(--primary-soft);
      }

      .btn-subtle {
        background: var(--muted-panel);
        color: var(--text);
      }

      .auth-status {
        margin-top: 10px;
        font-size: 13px;
        color: var(--text-soft);
      }

      .app-view {
        min-height: 100vh;
        display: flex;
        background: var(--bg);
      }

      .sidebar {
        width: 290px;
        background: var(--sidebar-bg);
        color: var(--sidebar-text);
        border-right: 1px solid var(--sidebar-line);
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .sidebar-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .logout-btn {
        margin-top: auto;
      }

      .menu-toggle {
        display: none;
        width: auto;
        min-width: 42px;
        height: 38px;
        border-radius: 10px;
        border: 1px solid var(--line);
        background: #fff;
        padding: 8px;
      }

      .menu-toggle-bars {
        display: grid;
        gap: 4px;
      }

      .menu-toggle-bars span {
        display: block;
        width: 18px;
        height: 2px;
        border-radius: 2px;
        background: var(--primary);
      }

      .sidebar-close {
        display: none;
        width: auto;
        min-width: 34px;
        height: 34px;
        border-radius: 8px;
        border: 1px solid var(--line);
        background: #242424;
        color: var(--sidebar-muted);
        border-color: var(--sidebar-line);
        padding: 0 10px;
        font-size: 14px;
      }

      .sidebar-overlay {
        display: none;
      }

      .brand {
        font-size: 16px;
        font-weight: 700;
        color: var(--sidebar-text);
      }

      .hint {
        font-size: 12px;
        color: var(--sidebar-muted);
        margin: 0;
      }

      .workspace {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
        height: 100vh;
        overflow: hidden;
      }

      .topbar {
        background: var(--panel);
        border-bottom: 1px solid var(--line);
        padding: 10px 16px;
        display: flex;
        justify-content: flex-start;
        gap: 12px;
        align-items: center;
      }

      .topbar-meta-box {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      #statusText {
        font-size: 12px;
        padding: 6px 10px;
        border-radius: 999px;
        background: #f3f4f6;
        border: 1px solid #e5e7eb;
      }

      .topbar-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
      }

      .control-pair {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .control-sm {
        width: 190px;
        min-width: 150px;
        font-size: 13px;
        padding: 9px 11px;
      }

      .tabs {
        display: flex;
        gap: 8px;
      }

      .sidebar-tabs {
        padding: 0;
        flex-direction: column;
      }

      .sidebar-tabs .tab {
        width: 100%;
      }

      .tab {
        border: 1px solid var(--sidebar-line);
        border-radius: 10px;
        padding: 10px 12px;
        font-size: 13px;
        background: transparent;
        color: var(--sidebar-muted);
        cursor: pointer;
        user-select: none;
        text-align: left;
      }

      .tab.active {
        background: #2a2a2a;
        color: var(--sidebar-text);
        border-color: #3a3a3a;
      }

      .log {
        overflow-y: auto;
        border: 0;
        border-radius: 0;
        padding: 18px 0;
        background: transparent;
      }

      .panel {
        display: none;
        flex: 1;
        min-height: 0;
      }

      .panel.active {
        display: flex;
        flex-direction: column;
      }

      .chat-panel {
        padding: 0 0 8px;
      }

      .chat-log {
        flex: 1;
        min-height: 0;
        width: min(920px, 100% - 32px);
        margin: 0 auto;
      }

      .msg {
        max-width: 100%;
        margin-bottom: 10px;
        padding: 12px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.55;
      }

      .msg.user {
        margin-left: auto;
        background: #2b2b2f;
        color: #fff;
      }

      .msg.bot {
        background: #ffffff;
        border: 1px solid #eceff3;
      }

      .msg small {
        display: block;
        color: var(--text-soft);
        margin-bottom: 6px;
        font-size: 12px;
      }

      .typing-cursor {
        display: inline-block;
        width: 8px;
        height: 1em;
        margin-left: 3px;
        background: #111827;
        vertical-align: text-bottom;
        animation: blink 1s steps(1) infinite;
      }

      .composer {
        margin: 0;
        width: min(980px, 100% - 32px);
        margin-left: auto;
        margin-right: auto;
        margin-bottom: 10px;
        background: #2b2b2f;
        border: 1px solid #3a3a3f;
        border-radius: 22px;
        padding: 12px 14px 10px;
        box-shadow: 0 10px 26px rgba(15, 23, 42, 0.2);
      }

      .composer textarea {
        border: 0;
        min-height: 24px;
        max-height: 72px;
        padding: 0;
        resize: none;
        overflow-y: auto;
        background: transparent;
        color: #f8fafc;
        font-size: 15px;
        line-height: 1.5;
      }

      .composer textarea::placeholder {
        color: #9ca3af;
      }

      .composer textarea::-webkit-scrollbar {
        width: 6px;
      }

      .composer textarea::-webkit-scrollbar-thumb {
        background: #56565d;
        border-radius: 999px;
      }

      .composer textarea:focus {
        outline: none;
      }

      .composer-actions {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        align-items: center;
        width: 100%;
        margin-top: 10px;
      }

      #clearChatBtn {
        width: 36px;
        height: 36px;
        border-radius: 14px;
        padding: 0;
        border: 1px solid #4a4a52;
        background: #34343a;
        color: #f3f4f6;
      }

      #sendBtn {
        width: 36px;
        height: 36px;
        min-width: 36px;
        border-radius: 999px;
        padding: 0;
        background: #f9fafb;
        color: #111827;
        border: 0;
      }

      .icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .icon-btn svg {
        width: 16px;
        height: 16px;
      }

      .soft-text {
        color: var(--text-soft);
        font-size: 12px;
      }

      .batch-panel,
      .history-panel {
        padding: 12px 18px 18px;
      }

      .code-block {
        font-family: "IBM Plex Mono", monospace;
        font-size: 12px;
        white-space: pre-wrap;
      }

      .pill {
        border-radius: 999px;
        padding: 6px 10px;
        border: 1px solid #d9dde5;
        background: #f8fafc;
        font-size: 12px;
      }

      #sessionBadge {
        border: 1px solid #2f2f2f;
        background: #1f1f1f;
        color: var(--sidebar-text);
      }

      #logoutBtn {
        background: #242424;
        color: var(--sidebar-text);
        border: 1px solid #333333;
      }

      .status-error {
        color: var(--danger);
        background: var(--danger-bg);
        border: 1px solid #fecdca;
        border-radius: 10px;
        padding: 8px 10px;
      }

      .status-ok {
        color: var(--ok-text);
        background: var(--ok-bg);
        border: 1px solid #abefc6;
        border-radius: 10px;
        padding: 8px 10px;
      }

      #batchResult,
      #historyResult {
        flex: 1;
        min-height: 180px;
      }

      @keyframes blink {
        50% {
          opacity: 0;
        }
      }

      @media (max-width: 1100px) {
        .control-sm {
          width: 160px;
          min-width: 130px;
        }

        .sidebar {
          width: 260px;
        }
      }

      @media (max-width: 979px) {
        .sidebar {
          width: min(82vw, 320px);
          max-width: 320px;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 30;
          border-right: 1px solid var(--line);
          border-bottom: 0;
          transform: translateX(-110%);
          transition: transform 180ms ease;
          box-shadow: 0 18px 40px rgba(16, 24, 40, 0.18);
          gap: 10px;
        }

        .app-view.drawer-open .sidebar {
          transform: translateX(0);
        }

        .sidebar-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .menu-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-overlay {
          display: block;
          position: fixed;
          inset: 0;
          background: rgba(16, 24, 40, 0.34);
          opacity: 0;
          pointer-events: none;
          transition: opacity 180ms ease;
          z-index: 20;
        }

        .app-view.drawer-open .sidebar-overlay {
          opacity: 1;
          pointer-events: auto;
        }

        .topbar {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 8px;
          padding: 8px 10px;
        }

        .topbar-meta-box {
          width: 100%;
          justify-content: space-between;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: #fff;
          padding: 6px 8px;
        }

        #menuToggleBtn {
          flex: 0 0 auto;
          order: 2;
        }

        #statusText {
          font-size: 11px;
          padding: 4px 8px;
          flex: 0 0 auto;
          margin-left: 0;
        }

        .topbar-controls {
          margin-left: 0;
          display: flex;
          align-items: center;
          flex: 0 0 auto;
          width: 100%;
          min-width: 0;
          gap: 6px;
          border: 0;
          border-radius: 0;
          background: transparent;
          padding: 0;
          overflow: visible;
        }

        .control-pair {
          display: flex;
          flex: 1 1 auto;
          min-width: 0;
          gap: 8px;
        }

        .control-sm {
          width: auto;
          min-width: 120px;
          flex: 1 1 0;
          padding: 7px 9px;
        }

        .chat-panel,
        .batch-panel,
        .history-panel {
          min-height: 0;
        }

        .chat-log,
        .composer {
          width: calc(100% - 20px);
        }

        .composer {
          margin-bottom: 6px;
          border-radius: 14px;
          padding: 10px;
        }

        .composer textarea {
          font-size: 13px;
          min-height: 21px;
          max-height: 63px;
        }

        #sendBtn {
          width: 34px;
          height: 34px;
          min-width: 34px;
        }

        #clearChatBtn {
          width: 34px;
          height: 34px;
        }
      }

      @media (max-width: 640px) {
        #sendBtn {
          width: 32px;
          height: 32px;
          min-width: 32px;
        }

        #clearChatBtn {
          width: 32px;
          height: 32px;
        }
      }

      @media (min-width: 1600px) {
        .sidebar {
          flex-direction: column;
          padding: 24px;
        }
        .topbar {
          padding: 14px 24px;
        }

        .chat-panel,
        .batch-panel,
        .history-panel {
          padding: 16px 24px 24px;
        }

        .msg {
          font-size: 16px;
        }

        .chat-log,
        .composer {
          width: min(1100px, 100% - 44px);
        }
      }

      @media (min-width: 2200px) {
        body {
          font-size: 20px;
        }

        .control-sm {
          width: 260px;
          font-size: 16px;
        }

        .tab {
          font-size: 16px;
          padding: 11px 18px;
        }
      }
    </style>
  </head>
  <body>
    <section id="authView" class="auth-view">
      <div class="auth-card">
        <h1 class="auth-title">OpenOKAPI</h1>
        <p class="auth-subtitle">Sign in with your gateway API key to unlock chat, streaming, batch and history tools.</p>

        <div class="auth-form">
          <input id="apiKey" class="mono" placeholder="Paste API key" autocomplete="off" />
          <div class="auth-actions">
            <button id="loginBtn" class="btn-dark">Log in</button>
            <button id="clearKeyBtn" class="btn-subtle" type="button">Clear</button>
          </div>
          <div id="authStatus" class="auth-status">Waiting for API key...</div>
        </div>
      </div>
    </section>

    <section id="appView" class="app-view hidden">
      <aside class="sidebar">
        <div class="sidebar-head">
          <div class="brand">OpenOKAPI Panel</div>
          <button id="closeMenuBtn" class="sidebar-close" type="button">X</button>
        </div>
        <p class="hint">Minimal workspace for OpenAI, Claude and Ollama through one gateway.</p>

        <div class="pill mono" id="sessionBadge">Session: not authenticated</div>

        <div class="tabs sidebar-tabs">
          <div class="tab active" data-tab="chat">Chat</div>
          <div class="tab" data-tab="batch">Batch</div>
          <div class="tab" data-tab="history">History</div>
        </div>

        <button id="logoutBtn" class="btn-subtle logout-btn">Log out</button>
      </aside>

      <div id="sidebarOverlay" class="sidebar-overlay"></div>

      <main class="workspace">
        <header class="topbar">
          <div class="topbar-meta-box">
            <span id="statusText" class="soft-text">Authenticated</span>
            <button id="menuToggleBtn" class="menu-toggle" type="button" aria-label="Open menu">
              <span class="menu-toggle-bars"><span></span><span></span><span></span></span>
            </button>
          </div>

          <div class="topbar-controls">
            <div class="control-pair">
              <select id="provider" class="control-sm">
                <option value="openai">OpenAI</option>
                <option value="claude">Claude</option>
                <option value="ollama">Ollama</option>
              </select>
              <select id="modelSelect" class="mono control-sm"></select>
            </div>
          </div>
        </header>

        <section id="chatPanel" class="panel chat-panel active">
          <div id="chatLog" class="log chat-log"></div>

          <div class="composer">
            <textarea id="prompt" placeholder="Ask anything... (Enter = send, Shift+Enter = new line)"></textarea>
            <div class="composer-actions">
              <button id="clearChatBtn" class="btn-subtle icon-btn" type="button" aria-label="Clear chat" title="Clear chat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M6 6l1 14h10l1-14" />
                  <path d="M10 10v7" />
                  <path d="M14 10v7" />
                </svg>
              </button>
              <button id="sendBtn" class="btn-dark icon-btn" type="button" aria-label="Send" title="Send">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 19V5" />
                  <path d="M6 11l6-6 6 6" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        <section id="batchPanel" class="panel batch-panel">
          <p class="hint" style="margin-top:0; margin-bottom:10px;">Run many prompts in one request with controlled concurrency.</p>
          <textarea id="batchPayload" class="mono code-block">[
  {"provider":"openai","prompt":"Summarize HTTP/3 in 3 bullets"},
  {"provider":"claude","prompt":"Explain event sourcing in simple terms"},
  {"provider":"ollama","prompt":"Write a tiny haiku about TypeScript"}
]</textarea>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <input id="batchConcurrency" class="mono" value="3" />
            <button id="runBatchBtn" class="btn-dark" style="width:auto">Run batch</button>
          </div>
          <pre id="batchResult" class="log code-block" style="margin-top:10px;"></pre>
        </section>

        <section id="historyPanel" class="panel history-panel">
          <div style="display:flex; gap:8px; margin-bottom:8px;">
            <button id="refreshHistoryBtn" class="btn-subtle" style="width:auto">Refresh</button>
            <button id="clearHistoryBtn" class="btn-subtle" style="width:auto">Clear history</button>
          </div>
          <pre id="historyResult" class="log code-block"></pre>
        </section>
      </main>
    </section>

    <script src="/panel/app.js"></script>
  </body>
</html>`;

const panelJs = `const KEY = 'openokapi_panel_api_key';

const els = {
  authView: document.getElementById('authView'),
  appView: document.getElementById('appView'),
  menuToggleBtn: document.getElementById('menuToggleBtn'),
  closeMenuBtn: document.getElementById('closeMenuBtn'),
  sidebarOverlay: document.getElementById('sidebarOverlay'),
  apiKey: document.getElementById('apiKey'),
  loginBtn: document.getElementById('loginBtn'),
  clearKeyBtn: document.getElementById('clearKeyBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  authStatus: document.getElementById('authStatus'),
  sessionBadge: document.getElementById('sessionBadge'),
  statusText: document.getElementById('statusText'),
  provider: document.getElementById('provider'),
  modelSelect: document.getElementById('modelSelect'),
  prompt: document.getElementById('prompt'),
  sendBtn: document.getElementById('sendBtn'),
  clearChatBtn: document.getElementById('clearChatBtn'),
  chatLog: document.getElementById('chatLog'),
  batchPayload: document.getElementById('batchPayload'),
  batchConcurrency: document.getElementById('batchConcurrency'),
  runBatchBtn: document.getElementById('runBatchBtn'),
  batchResult: document.getElementById('batchResult'),
  refreshHistoryBtn: document.getElementById('refreshHistoryBtn'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  historyResult: document.getElementById('historyResult')
};

let isAuthenticated = false;
let activeTypingAnimation = null;
const modelCatalog = {
  openai: [],
  claude: [],
  ollama: []
};

const OPENAI_FALLBACK_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-3.5-turbo'];
const CLAUDE_FALLBACK_MODELS = ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'];

function getApiKey() {
  return sessionStorage.getItem(KEY) || '';
}

function setApiKey(value) {
  if (!value) {
    sessionStorage.removeItem(KEY);
    return;
  }
  sessionStorage.setItem(KEY, value);
}

function authHeaders(candidateKey) {
  const key = candidateKey || getApiKey();
  return {
    'Content-Type': 'application/json',
    'X-API-Key': key,
    'X-OpenOKAPI-Client': 'web-panel'
  };
}

function setAuthStatus(message, type) {
  els.authStatus.textContent = message;
  els.authStatus.classList.remove('status-error', 'status-ok');
  if (type === 'error') {
    els.authStatus.classList.add('status-error');
  }
  if (type === 'ok') {
    els.authStatus.classList.add('status-ok');
  }
}

function setAppStatus(message) {
  els.statusText.textContent = message;
}

function toggleAuthState(authenticated, reason) {
  isAuthenticated = authenticated;
  els.authView.classList.toggle('hidden', authenticated);
  els.appView.classList.toggle('hidden', !authenticated);
  els.sessionBadge.textContent = authenticated ? 'Session: authenticated' : 'Session: not authenticated';
  setAppStatus(authenticated ? 'Authenticated' : reason || 'Not authenticated');
}

function isMobileDrawer() {
  return window.matchMedia('(max-width: 979px)').matches;
}

function closeDrawer() {
  els.appView.classList.remove('drawer-open');
}

function openDrawer() {
  if (!isMobileDrawer()) {
    return;
  }
  els.appView.classList.add('drawer-open');
}

function toggleDrawer() {
  if (!isMobileDrawer()) {
    return;
  }
  els.appView.classList.toggle('drawer-open');
}

function uniqueStrings(values) {
  const set = new Set();
  const out = [];

  values.forEach(function (value) {
    if (typeof value !== 'string') {
      return;
    }

    const cleaned = value.trim();
    if (!cleaned || set.has(cleaned)) {
      return;
    }

    set.add(cleaned);
    out.push(cleaned);
  });

  return out;
}

function setModelOptions(options, placeholder) {
  els.modelSelect.innerHTML = '';

  if (options.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = placeholder || 'No models available';
    els.modelSelect.appendChild(option);
    els.modelSelect.disabled = true;
    els.sendBtn.disabled = true;
    return;
  }

  options.forEach(function (model) {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = model;
    els.modelSelect.appendChild(option);
  });

  els.modelSelect.disabled = false;
  els.sendBtn.disabled = false;
}

function syncModelSelector() {
  const provider = els.provider.value;
  const available = modelCatalog[provider] || [];

  if (provider === 'openai' && available.length === 0) {
    setModelOptions([], 'No OpenAI model: missing API key');
    setAppStatus('OpenAI unavailable: configure API key first');
    return;
  }

  if (provider === 'claude' && available.length === 0) {
    setModelOptions([], 'No Claude model: missing API key');
    setAppStatus('Claude unavailable: configure API key first');
    return;
  }

  if (provider === 'ollama' && available.length === 0) {
    setModelOptions([], 'No Ollama model available');
    setAppStatus('Ollama unavailable: pull at least one model');
    return;
  }

  setModelOptions(available, 'No models available');
  setAppStatus('Authenticated');
}

async function refreshModelCatalog() {
  if (!isAuthenticated) {
    modelCatalog.openai = [];
    modelCatalog.claude = [];
    modelCatalog.ollama = [];
    syncModelSelector();
    return;
  }

  try {
    const openaiStatus = await apiRequest('/api/openai/status', { method: 'GET' });
    modelCatalog.openai = openaiStatus && openaiStatus.apiKey
      ? uniqueStrings([openaiStatus.defaultModel].concat(OPENAI_FALLBACK_MODELS))
      : [];
  } catch {
    modelCatalog.openai = [];
  }

  try {
    const claudeStatus = await apiRequest('/api/claude/status', { method: 'GET' });
    modelCatalog.claude = claudeStatus && claudeStatus.apiKey
      ? uniqueStrings([claudeStatus.defaultModel].concat(CLAUDE_FALLBACK_MODELS))
      : [];
  } catch {
    modelCatalog.claude = [];
  }

  try {
    const ollamaStatus = await apiRequest('/api/ollama/status', { method: 'GET' });
    if (!ollamaStatus || !ollamaStatus.enabled) {
      modelCatalog.ollama = [];
    } else {
      const ollamaList = await apiRequest('/api/ollama/list', { method: 'GET' });
      const models = Array.isArray(ollamaList.models) ? ollamaList.models : [];
      modelCatalog.ollama = uniqueStrings(models.map(function (item) {
        if (typeof item === 'string') {
          return item;
        }

        if (item && typeof item === 'object') {
          return item.name || item.model || '';
        }

        return '';
      }));
    }
  } catch {
    modelCatalog.ollama = [];
  }

  syncModelSelector();
}

function delay(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function autoResizePrompt() {
  els.prompt.style.height = '0px';
  const computed = window.getComputedStyle(els.prompt);
  const lineHeight = Number.parseFloat(computed.lineHeight) || 24;
  const maxHeight = Math.ceil(lineHeight * 3);
  const minHeight = Math.ceil(lineHeight);
  const nextHeight = Math.min(maxHeight, Math.max(minHeight, els.prompt.scrollHeight));
  els.prompt.style.height = nextHeight + 'px';
}

function scrollChatToBottom() {
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

function safeText(value) {
  return String(value || '').replace(/[<>]/g, '');
}

function verifyElements() {
  const missing = Object.keys(els).filter(function (key) {
    return !els[key];
  });

  if (missing.length > 0) {
    throw new Error('Panel DOM init failed. Missing: ' + missing.join(', '));
  }
}

async function verifyKey(candidate) {
  const response = await fetch('/api/history/summary?limit=1', {
    method: 'GET',
    headers: authHeaders(candidate)
  });

  return response.ok;
}

async function apiRequest(path, options) {
  if (!isAuthenticated) {
    throw new Error('Log in first');
  }

  const requestOptions = options || {};
  const response = await fetch(path, {
    ...requestOptions,
    headers: {
      ...authHeaders(),
      ...(requestOptions.headers || {})
    }
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const message = data.error || 'Request failed with status ' + response.status;
    throw new Error(message);
  }

  return data;
}

function addMessage(type, title, text) {
  const item = document.createElement('div');
  item.className = 'msg ' + type;
  item.innerHTML = '<small>' + safeText(title) + '</small><div>' + safeText(text).replace(/\\n/g, '<br>') + '</div>';
  els.chatLog.appendChild(item);
  scrollChatToBottom();
}

function createAssistantDraft(title) {
  const botMsg = document.createElement('div');
  botMsg.className = 'msg bot';
  botMsg.innerHTML = '<small>' + safeText(title || 'Assistant') + '</small><div></div>';

  const contentNode = botMsg.querySelector('div');
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';

  contentNode.textContent = 'Generating';
  contentNode.appendChild(cursor);
  els.chatLog.appendChild(botMsg);
  scrollChatToBottom();

  return { contentNode, cursor };
}

function startGeneratingAnimation(contentNode, cursor) {
  let dots = 0;
  const intervalId = setInterval(() => {
    dots = (dots + 1) % 4;
    contentNode.textContent = 'Generating' + '.'.repeat(dots);
    contentNode.appendChild(cursor);
    scrollChatToBottom();
  }, 240);

  return () => clearInterval(intervalId);
}

async function typeText(contentNode, cursor, text) {
  let index = 0;
  const dynamicDelay = text.length > 1200 ? 4 : 12;

  while (index < text.length) {
    const step = text.length > 1200 ? 5 : 2;
    index = Math.min(text.length, index + step);
    contentNode.textContent = text.slice(0, index);
    contentNode.appendChild(cursor);
    scrollChatToBottom();
    await delay(dynamicDelay);
  }

  cursor.remove();
}

async function login() {
  const candidate = els.apiKey.value.trim();
  if (!candidate) {
    setAuthStatus('Provide API key first', 'error');
    return;
  }

  setAuthStatus('Verifying key...');

  try {
    const ok = await verifyKey(candidate);
    if (!ok) {
      setAuthStatus('Invalid API key', 'error');
      return;
    }

    setApiKey(candidate);
    toggleAuthState(true);
    setAuthStatus('Authenticated', 'ok');
    els.apiKey.value = candidate;
    addMessage('bot', 'System', 'Session authenticated. You can start chatting now.');
    await refreshModelCatalog();
    await refreshHistory();
  } catch (error) {
    setAuthStatus('Login failed: ' + (error && error.message ? error.message : String(error)), 'error');
  }
}

function logout() {
  if (activeTypingAnimation) {
    activeTypingAnimation();
    activeTypingAnimation = null;
  }

  setApiKey('');
  els.apiKey.value = '';
  els.prompt.style.height = '24px';
  els.chatLog.innerHTML = '';
  els.batchResult.textContent = '';
  els.historyResult.textContent = 'Log in first';
  modelCatalog.openai = [];
  modelCatalog.claude = [];
  modelCatalog.ollama = [];
  toggleAuthState(false, 'Not authenticated');
  setAuthStatus('Logged out. Paste API key to continue.');
  syncModelSelector();
  closeDrawer();
}

async function sendChat() {
  if (!isAuthenticated) {
    setAppStatus('Log in first');
    return;
  }

  const prompt = els.prompt.value.trim();
  const provider = els.provider.value;
  const model = els.modelSelect.value;
  const stream = true;

  if (!prompt) {
    return;
  }

  if (!model) {
    setAppStatus('No model available for selected provider');
    return;
  }

  addMessage('user', 'You', prompt);
  els.prompt.value = '';
  autoResizePrompt();

  if (stream) {
    await streamChat(provider, model, prompt);
    await refreshHistory();
    return;
  }

  const draft = createAssistantDraft('Assistant');
  const stopGenerating = startGeneratingAnimation(draft.contentNode, draft.cursor);
  activeTypingAnimation = stopGenerating;

  try {
    const data = await apiRequest('/api/' + provider + '/ask', {
      method: 'POST',
      body: JSON.stringify({ prompt: prompt, model: model })
    });

    stopGenerating();
    activeTypingAnimation = null;

    const meta = data.meta
      ? '[' + data.meta.providerUsed + (data.meta.fallbackUsed ? ' via failover' : '') + ']\\n'
      : '';

    await typeText(draft.contentNode, draft.cursor, meta + (data.response || ''));
    await refreshHistory();
  } catch (error) {
    stopGenerating();
    activeTypingAnimation = null;
    draft.cursor.remove();
    draft.contentNode.textContent = '[error] ' + (error && error.message ? error.message : String(error));
  }
}

async function streamChat(provider, model, prompt) {
  if (!model) {
    setAppStatus('No model available for selected provider');
    return;
  }

  const draft = createAssistantDraft('Assistant (stream)');
  const stopGenerating = startGeneratingAnimation(draft.contentNode, draft.cursor);
  activeTypingAnimation = stopGenerating;

  const endpoint = '/api/' + provider + '/stream';

  let streamText = '';
  let firstChunkReceived = false;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ prompt: prompt, model: model })
    });

    if (!response.ok || !response.body) {
      stopGenerating();
      activeTypingAnimation = null;
      const data = await response.json().catch(function () {
        return {};
      });
      draft.cursor.remove();
      draft.contentNode.textContent = '[error] ' + (data.error || 'Streaming failed');
      return;
    }

    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    let buffer = '';

    while (true) {
      const result = await reader.read();
      if (result.done) {
        break;
      }

      buffer += decoder.decode(result.value, { stream: true });
      const frames = buffer.split('\\n\\n');
      buffer = frames.pop() || '';

      for (const frame of frames) {
        const lines = frame.split('\\n');
        let event = 'message';
        let data = '';

        for (const line of lines) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          if (line.startsWith('data:')) data += line.slice(5).trim();
        }

        if (!data) continue;
        const payload = JSON.parse(data);

        if (event === 'error') {
          stopGenerating();
          activeTypingAnimation = null;
          draft.cursor.remove();
          draft.contentNode.textContent = streamText + '\\n[error] ' + (payload.error || 'unknown');
          continue;
        }

        if (event === 'done') {
          stopGenerating();
          activeTypingAnimation = null;
          if (payload.fallbackUsed) {
            streamText += '\\n\\n[fallback: ' + payload.providerUsed + ']';
            draft.contentNode.textContent = streamText;
          }
          draft.cursor.remove();
          await refreshHistory();
          continue;
        }

        if (!firstChunkReceived) {
          stopGenerating();
          activeTypingAnimation = null;
          firstChunkReceived = true;
          streamText = '';
        }

        streamText += payload.chunk || '';
        draft.contentNode.textContent = streamText;
        draft.contentNode.appendChild(draft.cursor);
        scrollChatToBottom();
      }
    }
  } catch (error) {
    stopGenerating();
    activeTypingAnimation = null;
    draft.cursor.remove();
    draft.contentNode.textContent = '[error] ' + (error && error.message ? error.message : String(error));
  }
}

async function runBatch() {
  if (!isAuthenticated) {
    setAppStatus('Log in first');
    return;
  }

  let payload;
  try {
    payload = JSON.parse(els.batchPayload.value);
  } catch {
    els.batchResult.textContent = 'Invalid JSON payload';
    return;
  }

  const concurrency = Number.parseInt(els.batchConcurrency.value || '3', 10);

  try {
    const data = await apiRequest('/api/batch', {
      method: 'POST',
      body: JSON.stringify({ requests: payload, concurrency: concurrency })
    });
    els.batchResult.textContent = JSON.stringify(data, null, 2);
    await refreshHistory();
  } catch (error) {
    els.batchResult.textContent = '[error] ' + (error && error.message ? error.message : String(error));
  }
}

async function refreshHistory() {
  if (!isAuthenticated) {
    els.historyResult.textContent = 'Log in first';
    return;
  }

  try {
    const data = await apiRequest('/api/history/recent?limit=20', { method: 'GET' });
    els.historyResult.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    els.historyResult.textContent = '[error] ' + (error && error.message ? error.message : String(error));
  }
}

async function clearHistory() {
  if (!isAuthenticated) {
    setAppStatus('Log in first');
    return;
  }

  try {
    await apiRequest('/api/history', { method: 'DELETE' });
    await refreshHistory();
  } catch (error) {
    setAppStatus('Failed to clear history: ' + (error && error.message ? error.message : String(error)));
  }
}

function initTabs() {
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const panels = {
    chat: document.getElementById('chatPanel'),
    batch: document.getElementById('batchPanel'),
    history: document.getElementById('historyPanel')
  };

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (node) {
        node.classList.remove('active');
      });
      tab.classList.add('active');
      Object.values(panels).forEach(function (panel) {
        if (panel) {
          panel.classList.remove('active');
        }
      });

      const key = tab.dataset.tab;
      if (!key || !panels[key]) {
        return;
      }

      panels[key].classList.add('active');

      if (isMobileDrawer()) {
        closeDrawer();
      }
    });
  });
}

async function restoreSession() {
  const existing = getApiKey();
  if (!existing) {
    toggleAuthState(false, 'Not authenticated');
    setAuthStatus('Waiting for API key...');
    return;
  }

  els.apiKey.value = existing;
  setAuthStatus('Restoring session...');

  try {
    const ok = await verifyKey(existing);
    if (!ok) {
      setApiKey('');
      toggleAuthState(false, 'Stored key is invalid');
      setAuthStatus('Stored API key is invalid. Paste a fresh key.', 'error');
      return;
    }

    toggleAuthState(true);
    setAuthStatus('Authenticated', 'ok');
    await refreshModelCatalog();
    await refreshHistory();
  } catch (error) {
    toggleAuthState(false, 'Failed to restore session');
    setAuthStatus('Failed to restore session: ' + (error && error.message ? error.message : String(error)), 'error');
  }
}

function bindEvents() {
  initTabs();

  els.menuToggleBtn.addEventListener('click', toggleDrawer);
  els.closeMenuBtn.addEventListener('click', closeDrawer);
  els.sidebarOverlay.addEventListener('click', closeDrawer);

  els.loginBtn.addEventListener('click', login);
  els.clearKeyBtn.addEventListener('click', function () {
    els.apiKey.value = '';
    setApiKey('');
    setAuthStatus('Key cleared. Paste API key to continue.');
  });
  els.logoutBtn.addEventListener('click', logout);
  els.provider.addEventListener('change', syncModelSelector);
  els.sendBtn.addEventListener('click', sendChat);
  els.clearChatBtn.addEventListener('click', function () {
    els.chatLog.innerHTML = '';
  });
  els.runBatchBtn.addEventListener('click', runBatch);
  els.refreshHistoryBtn.addEventListener('click', refreshHistory);
  els.clearHistoryBtn.addEventListener('click', clearHistory);

  els.apiKey.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      login();
    }
  });

  els.prompt.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendChat();
    }
  });

  els.prompt.addEventListener('input', autoResizePrompt);

  window.addEventListener('resize', function () {
    if (!isMobileDrawer()) {
      closeDrawer();
    }
  });
}

async function boot() {
  try {
    verifyElements();
    autoResizePrompt();
    bindEvents();
    await restoreSession();
  } catch (error) {
    setAuthStatus('Panel bootstrap failed: ' + (error && error.message ? error.message : String(error)), 'error');
  }
}

boot();`;

router.get("/", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.send(panelHtml);
});

router.get("/app.js", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.send(panelJs);
});

export default router;
