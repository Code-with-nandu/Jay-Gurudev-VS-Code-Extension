# 🙏 Jay Gurudev AI

An independent, secure AI Coding Assistant extension for Visual Studio Code, connected to your **JayGurudev AI model server**.

---

## ✨ Features

- **Sidebar AI Chat**: A dedicated Activity Bar icon and responsive Sidebar Chat interface with gold Jay Gurudev branding (`#F59E0B`).
- **OpenAI-Compatible Streaming**: Real-time token streaming with Server-Sent Events (SSE) and cancellation support.
- **Multilingual Support**: First-class support for both **English** and **Bengali (বাংলা)** prompts and responses.
- **Context-Aware Coding**:
  - Automatically captures active editor context (file name, language, line range, and selection).
  - Quick action chips: *Explain Code*, *Refactor*, *Find Bugs*, and *বাংলায় ব্যাখ্যা*.
- **Right-Click Context Menu**:
  - `Jay Gurudev: Explain Selected Code`
  - `Jay Gurudev: Refactor Selected Code`
  - `Jay Gurudev: Debug Selected Code`
  - `Jay Gurudev: Generate Code`
- **Interactive Code Blocks**:
  - Language header tag.
  - One-click **Copy** button.
  - One-click **Insert** button to inject generated code directly into the active editor.
- **Strict Safety & Permissions**:
  - No terminal commands are executed.
  - File reading and file creation require explicit user approval dialogs.
- **Secure Secret Storage**:
  - API keys are stored encrypted in VS Code's official `SecretStorage` (`context.secrets`), never exposed in plaintext or frontend code.
- **Theme Adaptive**: Fully integrated with VS Code dark, light, and high-contrast themes.

---

## ⚙️ Configuration

Open **Settings** (`Ctrl+,`) and search for `jayGurudev`:

| Setting | Default | Description |
| :--- | :--- | :--- |
| `jayGurudev.baseUrl` | `https://desktop-tq3n3fd.tail4fa6f3.ts.net` | Base URL of your JayGurudev model server. |
| `jayGurudev.model` | `jayGurudev` | Model identifier sent in requests. |
| `jayGurudev.apiKeyHeader` | `x-api-key` | Header name used to send your API key. |
| `jayGurudev.stream` | `true` | Stream tokens in real time. |
| `jayGurudev.temperature` | `0.7` | Sampling temperature (0.0 to 2.0). |
| `jayGurudev.maxTokens` | `4096` | Maximum generation length. |
| `jayGurudev.systemPrompt` | Custom instructions | System prompt for Jay Gurudev AI assistant. |

---

## 🔑 Setting the API Key

You can set or update your API key at any time:
1. In the Jay Gurudev Sidebar, click the **🔑 Key** button (or run Command Palette: `Jay Gurudev: Set API Key`).
2. Enter your secret token in the secure password input.
3. The key is securely encrypted and stored inside VS Code `SecretStorage`.

---

## 📦 Installation from VSIX

To install the packaged extension:

1. Open VS Code.
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
3. Choose **Extensions: Install from VSIX...**.
4. Select the file `jay-gurudev-extension-0.1.0.vsix` located in this workspace.

Alternatively, from the terminal:
```bash
code --install-extension jay-gurudev-extension-0.1.0.vsix
```

---

## 🛡️ Architecture & Safety

- Built in 100% **TypeScript** with strict type-safety.
- Communicates using the official `vscode.WebviewViewProvider` with Content Security Policy (CSP).
- Completely independent from any other AI extensions.
