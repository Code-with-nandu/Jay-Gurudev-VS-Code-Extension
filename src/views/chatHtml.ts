import * as vscode from 'vscode';

export function getChatHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  // Use a nonce to whitelist script execution
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https: data:;">
  <title>Jay Gurudev AI</title>
  <style>
    :root {
      --primary-gold: #F59E0B;
      --primary-gold-hover: #D97706;
      --gold-bg-subtle: rgba(245, 158, 11, 0.12);
      --font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Kalpurush', 'SolaimanLipi', sans-serif);
      --font-size: var(--vscode-font-size, 13px);
      --bg: var(--vscode-sideBar-background, #1e1e1e);
      --fg: var(--vscode-foreground, #cccccc);
      --input-bg: var(--vscode-input-background, #252526);
      --input-fg: var(--vscode-input-foreground, #cccccc);
      --input-border: var(--vscode-input-border, #3c3c3c);
      --btn-bg: var(--vscode-button-background, #F59E0B);
      --btn-fg: var(--vscode-button-foreground, #000000);
      --btn-hover: var(--vscode-button-hoverBackground, #d97706);
      --secondary-btn-bg: var(--vscode-button-secondaryBackground, #3a3d41);
      --secondary-btn-fg: var(--vscode-button-secondaryForeground, #ffffff);
      --card-user: var(--vscode-editorWidget-background, #252526);
      --card-ai: var(--vscode-editor-background, #1e1e1e);
      --border-color: var(--vscode-widget-border, rgba(128, 128, 128, 0.2));
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--font-family);
      font-size: var(--font-size);
      background-color: var(--bg);
      color: var(--fg);
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    /* Header */
    .header {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg);
      flex-shrink: 0;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-icon {
      width: 22px;
      height: 22px;
      fill: var(--primary-gold);
    }

    .brand-title {
      font-weight: 600;
      font-size: 13px;
      color: var(--primary-gold);
      letter-spacing: 0.3px;
    }

    .header-actions {
      display: flex;
      gap: 6px;
    }

    .icon-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--fg);
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 4px;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 4px;
      opacity: 0.85;
      transition: all 0.15s ease;
    }

    .icon-btn:hover {
      background: var(--secondary-btn-bg);
      opacity: 1;
      border-color: var(--border-color);
    }

    /* Quick Action Chips */
    .quick-chips {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color);
      flex-shrink: 0;
      scrollbar-width: none;
    }
    .quick-chips::-webkit-scrollbar {
      display: none;
    }

    .chip {
      background: var(--gold-bg-subtle);
      color: var(--primary-gold);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .chip:hover {
      background: rgba(245, 158, 11, 0.25);
      border-color: var(--primary-gold);
    }

    /* Context Banner */
    .context-bar {
      display: none;
      padding: 4px 12px;
      background: var(--card-user);
      font-size: 11px;
      color: var(--primary-gold);
      border-bottom: 1px solid var(--border-color);
      align-items: center;
      justify-content: space-between;
    }

    .context-bar.active {
      display: flex;
    }

    .context-tag {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 80%;
    }

    /* Messages container */
    .chat-container {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }

    .message {
      display: flex;
      flex-direction: column;
      gap: 4px;
      animation: fadeIn 0.2s ease-in-out;
      max-width: 100%;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .message-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      opacity: 0.75;
      padding: 0 4px;
    }

    .message.user .message-header {
      justify-content: flex-end;
    }

    .message-body {
      padding: 10px 12px;
      border-radius: 8px;
      line-height: 1.5;
      word-wrap: break-word;
      font-size: 12.5px;
    }

    .message.user .message-body {
      background: var(--card-user);
      border: 1px solid var(--border-color);
      border-left: 3px solid var(--primary-gold);
    }

    .message.assistant .message-body {
      background: var(--card-ai);
      border: 1px solid var(--border-color);
    }

    .message.error .message-body {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
    }

    /* Markdown Styling */
    .message-body p {
      margin-bottom: 8px;
    }
    .message-body p:last-child {
      margin-bottom: 0;
    }

    .message-body code {
      font-family: var(--vscode-editor-font-family, 'Courier New', monospace);
      font-size: 11.5px;
      background: rgba(128, 128, 128, 0.18);
      padding: 1px 4px;
      border-radius: 3px;
    }

    .code-block-wrapper {
      margin: 8px 0;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid var(--border-color);
      background: var(--input-bg);
    }

    .code-block-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 10px;
      background: rgba(0, 0, 0, 0.25);
      font-size: 11px;
      opacity: 0.85;
      border-bottom: 1px solid var(--border-color);
    }

    .code-actions {
      display: flex;
      gap: 6px;
    }

    .code-action-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--fg);
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 3px;
      transition: background 0.1s;
    }

    .code-action-btn:hover {
      background: var(--secondary-btn-bg);
      color: var(--primary-gold);
    }

    .code-block-wrapper pre {
      margin: 0;
      padding: 10px;
      overflow-x: auto;
      font-family: var(--vscode-editor-font-family, 'Courier New', monospace);
      font-size: 11.5px;
      line-height: 1.45;
    }

    .message-body ul, .message-body ol {
      margin-left: 20px;
      margin-bottom: 8px;
    }

    .message-body blockquote {
      border-left: 3px solid var(--primary-gold);
      padding-left: 10px;
      margin: 8px 0;
      opacity: 0.85;
    }

    /* Typing indicator */
    .typing-indicator {
      display: none;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      font-size: 11px;
      color: var(--primary-gold);
      background: var(--bg);
      border-top: 1px solid var(--border-color);
    }

    .typing-indicator.active {
      display: flex;
      justify-content: space-between;
    }

    .dots-wrapper {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .dot {
      width: 6px;
      height: 6px;
      background: var(--primary-gold);
      border-radius: 50%;
      animation: pulse 1.2s infinite ease-in-out;
    }
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes pulse {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }

    .stop-btn {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.5);
      color: #f87171;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10.5px;
      cursor: pointer;
    }

    .stop-btn:hover {
      background: rgba(239, 68, 68, 0.35);
    }

    /* Input Footer */
    .footer {
      padding: 10px 12px;
      border-top: 1px solid var(--border-color);
      background: var(--bg);
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .input-row {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }

    .chat-textarea {
      flex: 1;
      min-height: 40px;
      max-height: 160px;
      background: var(--input-bg);
      color: var(--input-fg);
      border: 1px solid var(--input-border);
      border-radius: 6px;
      padding: 8px 10px;
      font-family: var(--font-family);
      font-size: 12.5px;
      resize: none;
      outline: none;
      line-height: 1.4;
    }

    .chat-textarea:focus {
      border-color: var(--primary-gold);
    }

    .send-btn {
      background: var(--primary-gold);
      color: #000000;
      border: none;
      border-radius: 6px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-weight: bold;
      transition: background 0.15s ease;
      flex-shrink: 0;
    }

    .send-btn:hover {
      background: var(--primary-gold-hover);
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .send-btn svg {
      width: 16px;
      height: 16px;
      fill: #000000;
    }

    .input-hints {
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      opacity: 0.6;
      padding: 0 2px;
    }

    /* Empty state */
    .empty-state {
      margin: auto;
      text-align: center;
      padding: 24px 16px;
      opacity: 0.85;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .empty-icon {
      width: 44px;
      height: 44px;
      fill: var(--primary-gold);
      margin-bottom: 4px;
    }

    .empty-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-gold);
    }

    .empty-desc {
      font-size: 11.5px;
      max-width: 240px;
      line-height: 1.4;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="brand">
      <svg class="brand-icon" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#F59E0B"/>
        <path d="M50 15 L58 40 L85 50 L58 60 L50 85 L42 60 L15 50 L42 40 Z" fill="#FFFFFF"/>
      </svg>
      <span class="brand-title">Jay Gurudev AI</span>
    </div>
    <div class="header-actions">
      <button class="icon-btn" id="newChatBtn" title="Start New Conversation">
        <span>+ New</span>
      </button>
      <button class="icon-btn" id="apiKeyBtn" title="Set or Update API Key">
        <span>🔑 Key</span>
      </button>
      <button class="icon-btn" id="clearBtn" title="Clear History">
        <span>🗑️</span>
      </button>
    </div>
  </div>

  <!-- Quick Action Chips -->
  <div class="quick-chips">
    <div class="chip" data-prompt="Explain this selected code clearly step by step:">📖 Explain Code</div>
    <div class="chip" data-prompt="Refactor this code for readability, performance, and best practices:">⚡ Refactor</div>
    <div class="chip" data-prompt="Analyze this code for potential bugs, edge cases, and runtime issues:">🐛 Find Bugs</div>
    <div class="chip" data-prompt="এই কোডটি বাংলায় সহজ ভাষায় ব্যাখ্যা করুন:">🇧🇩 বাংলায় ব্যাখ্যা</div>
  </div>

  <!-- Context Bar -->
  <div class="context-bar" id="contextBar">
    <span class="context-tag" id="contextTag">📎 Active Editor Context</span>
    <span style="cursor:pointer;" id="clearContextBtn" title="Remove context">✕</span>
  </div>

  <!-- Chat Scroll Area -->
  <div class="chat-container" id="chatContainer">
    <div class="empty-state" id="emptyState">
      <svg class="empty-icon" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#F59E0B"/>
        <path d="M50 15 L58 40 L85 50 L58 60 L50 85 L42 60 L15 50 L42 40 Z" fill="#FFFFFF"/>
      </svg>
      <div class="empty-title">Jay Gurudev AI</div>
      <div class="empty-desc">
        Your independent AI coding assistant. Ask questions in English or বাংলা, generate or debug code.
      </div>
    </div>
  </div>

  <!-- Typing / Streaming Indicator -->
  <div class="typing-indicator" id="typingIndicator">
    <div class="dots-wrapper">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
      <span style="margin-left: 6px;">Jay Gurudev is thinking...</span>
    </div>
    <button class="stop-btn" id="stopStreamBtn">■ Stop</button>
  </div>

  <!-- Footer Input Area -->
  <div class="footer">
    <div class="input-row">
      <textarea
        class="chat-textarea"
        id="userInput"
        rows="1"
        placeholder="Ask Jay Gurudev... (Enter to send, Shift+Enter for new line)"
      ></textarea>
      <button class="send-btn" id="sendBtn" title="Send message">
        <svg viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
    <div class="input-hints">
      <span>Enter ↵ to send • Shift+Enter for newline</span>
      <span id="keyStatusBadge">🔒 API Key Set</span>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    const chatContainer = document.getElementById('chatContainer');
    const emptyState = document.getElementById('emptyState');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const clearBtn = document.getElementById('clearBtn');
    const apiKeyBtn = document.getElementById('apiKeyBtn');
    const typingIndicator = document.getElementById('typingIndicator');
    const stopStreamBtn = document.getElementById('stopStreamBtn');
    const contextBar = document.getElementById('contextBar');
    const contextTag = document.getElementById('contextTag');
    const clearContextBtn = document.getElementById('clearContextBtn');
    const keyStatusBadge = document.getElementById('keyStatusBadge');

    let currentContext = null;
    let isStreaming = false;

    // Auto-resize textarea
    userInput.addEventListener('input', () => {
      userInput.style.height = 'auto';
      userInput.style.height = Math.min(userInput.scrollHeight, 160) + 'px';
    });

    // Enter to send
    userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    sendBtn.addEventListener('click', sendMessage);

    newChatBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'newChat' });
    });

    clearBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'clearChat' });
    });

    apiKeyBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'setApiKey' });
    });

    stopStreamBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'cancelStream' });
    });

    clearContextBtn.addEventListener('click', () => {
      currentContext = null;
      contextBar.classList.remove('active');
    });

    // Quick chips
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        userInput.value = prompt ? prompt + ' ' : '';
        userInput.focus();
        userInput.dispatchEvent(new Event('input'));
      });
    });

    function sendMessage() {
      const text = userInput.value.trim();
      if (!text || isStreaming) return;

      vscode.postMessage({
        type: 'sendMessage',
        text,
        includeContext: !!currentContext
      });

      userInput.value = '';
      userInput.style.height = 'auto';
    }

    // Handle messages from Extension
    window.addEventListener('message', (event) => {
      const msg = event.data;
      switch (msg.type) {
        case 'init':
          renderHistory(msg.messages);
          updateKeyStatus(msg.hasApiKey);
          break;
        case 'addMessage':
          appendMessage(msg.message);
          break;
        case 'updateMessageChunk':
          updateChunk(msg.id, msg.chunk);
          break;
        case 'finishMessage':
          finishMessage(msg.id, msg.fullContent);
          break;
        case 'messageError':
          showError(msg.id, msg.error);
          break;
        case 'setLoading':
          setLoading(msg.isLoading);
          break;
        case 'clearHistory':
          chatContainer.innerHTML = '';
          chatContainer.appendChild(emptyState);
          emptyState.style.display = 'flex';
          break;
        case 'apiKeyStatus':
          updateKeyStatus(msg.hasKey);
          break;
        case 'activeContext':
          updateContext(msg.context);
          break;
      }
    });

    function updateKeyStatus(hasKey) {
      if (hasKey) {
        keyStatusBadge.textContent = '🔒 Key Configured';
        keyStatusBadge.style.color = '#34d399';
      } else {
        keyStatusBadge.textContent = '⚠️ Click 🔑 Key to configure';
        keyStatusBadge.style.color = '#fbbf24';
      }
    }

    function updateContext(ctx) {
      currentContext = ctx;
      if (ctx && (ctx.selection || ctx.file)) {
        contextTag.textContent = '📎 ' + (ctx.file || 'Editor') + (ctx.startLine ? ' (' + ctx.startLine + '-' + ctx.endLine + ')' : '');
        contextBar.classList.add('active');
      } else {
        contextBar.classList.remove('active');
      }
    }

    function setLoading(loading) {
      isStreaming = loading;
      if (loading) {
        typingIndicator.classList.add('active');
        sendBtn.disabled = true;
      } else {
        typingIndicator.classList.remove('active');
        sendBtn.disabled = false;
      }
      scrollToBottom();
    }

    function renderHistory(messages) {
      chatContainer.innerHTML = '';
      if (!messages || messages.length === 0) {
        chatContainer.appendChild(emptyState);
        emptyState.style.display = 'flex';
        return;
      }
      emptyState.style.display = 'none';
      messages.forEach(m => appendMessage(m));
    }

    function appendMessage(m) {
      emptyState.style.display = 'none';
      const existing = document.getElementById('msg-' + m.id);
      if (existing) return;

      const msgDiv = document.createElement('div');
      msgDiv.className = 'message ' + m.role + (m.isError ? ' error' : '');
      msgDiv.id = 'msg-' + m.id;

      const headerDiv = document.createElement('div');
      headerDiv.className = 'message-header';
      headerDiv.textContent = m.role === 'user' ? 'You' : '🙏 Jay Gurudev AI';

      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'message-body';
      bodyDiv.id = 'body-' + m.id;
      bodyDiv.innerHTML = formatMarkdown(m.content);

      msgDiv.appendChild(headerDiv);
      msgDiv.appendChild(bodyDiv);
      chatContainer.appendChild(msgDiv);

      attachCodeActions(bodyDiv);
      scrollToBottom();
    }

    function updateChunk(id, chunk) {
      const body = document.getElementById('body-' + id);
      if (body) {
        if (!body.dataset.raw) {
          body.dataset.raw = '';
        }
        body.dataset.raw += chunk;
        body.innerHTML = formatMarkdown(body.dataset.raw);
        attachCodeActions(body);
        scrollToBottom();
      }
    }

    function finishMessage(id, fullContent) {
      const body = document.getElementById('body-' + id);
      if (body) {
        body.innerHTML = formatMarkdown(fullContent);
        attachCodeActions(body);
      }
      setLoading(false);
      scrollToBottom();
    }

    function showError(id, err) {
      appendMessage({
        id: id || Date.now().toString(),
        role: 'assistant',
        content: '⚠️ ' + err,
        timestamp: Date.now(),
        isError: true
      });
      setLoading(false);
    }

    function scrollToBottom() {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Markdown Parser & Sanitizer
    function formatMarkdown(text) {
      if (!text) return '';

      // Escape HTML tags to prevent XSS
      let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Code blocks formatting
      const codeBlockRegex = new RegExp('\\x60\\x60\\x60([a-zA-Z0-9_\\-\\.]*)\\n([\\s\\S]*?)\\x60\\x60\\x60', 'g');
      html = html.replace(codeBlockRegex, (match, lang, code) => {
        const cleanLang = lang.trim() || 'text';
        const rawCode = code.trim();
        return (
          '<div class="code-block-wrapper">' +
            '<div class="code-block-header">' +
              '<span>' + cleanLang + '</span>' +
              '<div class="code-actions">' +
                '<button class="code-action-btn copy-btn" data-code="' + encodeURIComponent(rawCode) + '">📋 Copy</button>' +
                '<button class="code-action-btn insert-btn" data-code="' + encodeURIComponent(rawCode) + '">📥 Insert</button>' +
              '</div>' +
            '</div>' +
            '<pre><code>' + rawCode + '</code></pre>' +
          '</div>'
        );
      });

      // Inline code formatting
      const inlineCodeRegex = new RegExp('\\x60([^\\x60]+)\\x60', 'g');
      html = html.replace(inlineCodeRegex, '<code>$1</code>');

      // Bold & Italic
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

      // Headings
      html = html.replace(/^### (.*$)/gim, '<h4 style="margin: 6px 0; color: var(--primary-gold);">$1</h4>');
      html = html.replace(/^## (.*$)/gim, '<h3 style="margin: 8px 0; color: var(--primary-gold);">$1</h3>');
      html = html.replace(/^# (.*$)/gim, '<h2 style="margin: 10px 0; color: var(--primary-gold);">$1</h2>');

      // Unordered lists
      html = html.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li>$1</li>');

      // Paragraph newlines
      html = html.replace(/\n\n/g, '<br/><br/>');
      html = html.replace(/\n/g, '<br/>');

      return html;
    }

    function attachCodeActions(container) {
      container.querySelectorAll('.copy-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const raw = decodeURIComponent(btn.getAttribute('data-code'));
          navigator.clipboard.writeText(raw).then(() => {
            const originalText = btn.innerHTML;
            btn.innerHTML = '✓ Copied!';
            setTimeout(() => { btn.innerHTML = originalText; }, 2000);
          });
        };
      });

      container.querySelectorAll('.insert-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const raw = decodeURIComponent(btn.getAttribute('data-code'));
          vscode.postMessage({ type: 'insertCode', code: raw });
        };
      });
    }

    // Inform extension that webview is ready
    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
