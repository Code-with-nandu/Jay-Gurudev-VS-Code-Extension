import * as vscode from 'vscode';
import {
  ChatMessage,
  ExtensionConfig,
  WebviewToExtensionMessage
} from '../types';
import { getChatHtml } from '../views/chatHtml';
import { JayGurudevApiClient } from '../services/apiClient';
import { SecretService } from '../services/secretStorage';
import { WorkspaceContextService } from '../services/workspaceContext';

export class JayGurudevChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'jayGurudev.chat';

  private view?: vscode.WebviewView;
  private messages: ChatMessage[] = [];
  private apiClient = new JayGurudevApiClient();

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly secretService: SecretService,
    private readonly workspaceService: WorkspaceContextService,
    private readonly state: vscode.Memento
  ) {
    // Restore past session if available
    const saved = this.state.get<ChatMessage[]>('jayGurudev.chatHistory');
    if (saved && Array.isArray(saved)) {
      this.messages = saved;
    }
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = getChatHtml(webviewView.webview, this.extensionUri);

    // Message handler
    webviewView.webview.onDidReceiveMessage(async (msg: WebviewToExtensionMessage) => {
      switch (msg.type) {
        case 'ready':
          await this.sendInitState();
          this.updateActiveEditorContext();
          break;

        case 'sendMessage':
          await this.handleUserMessage(msg.text, msg.includeContext);
          break;

        case 'cancelStream':
          this.apiClient.cancelCurrentRequest();
          this.postMessage({ type: 'setLoading', isLoading: false });
          break;

        case 'newChat':
          this.startNewChat();
          break;

        case 'clearChat':
          this.clearChatHistory();
          break;

        case 'setApiKey':
          const updated = await this.secretService.promptSetApiKey();
          if (updated) {
            const hasKey = await this.secretService.hasApiKey();
            this.postMessage({ type: 'apiKeyStatus', hasKey });
          }
          break;

        case 'insertCode':
          await this.workspaceService.applyCodeToEditor(msg.code);
          break;

        case 'openSettings':
          vscode.commands.executeCommand(
            'workbench.action.openSettings',
            'jayGurudev'
          );
          break;
      }
    });

    // Track active editor selection changes for dynamic context
    vscode.window.onDidChangeActiveTextEditor(() => {
      this.updateActiveEditorContext();
    });

    vscode.window.onDidChangeTextEditorSelection(() => {
      this.updateActiveEditorContext();
    });

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.updateActiveEditorContext();
      }
    });
  }

  private async sendInitState(): Promise<void> {
    const hasApiKey = await this.secretService.hasApiKey();
    const config = this.getConfig();

    this.postMessage({
      type: 'init',
      messages: this.messages,
      hasApiKey,
      config
    });
  }

  private updateActiveEditorContext(): void {
    if (!this.view) return;
    const ctx = this.workspaceService.getActiveEditorContext();
    this.postMessage({
      type: 'activeContext',
      context: ctx
    });
  }

  private getConfig(): ExtensionConfig {
    const cfg = vscode.workspace.getConfiguration('jayGurudev');
    return {
      baseUrl: cfg.get<string>('baseUrl', 'https://desktop-tq3n3fd.tail4fa6f3.ts.net'),
      model: cfg.get<string>('model', 'jayGurudev'),
      apiKeyHeader: cfg.get<string>('apiKeyHeader', 'x-api-key'),
      temperature: cfg.get<number>('temperature', 0.7),
      maxTokens: cfg.get<number>('maxTokens', 4096),
      stream: cfg.get<boolean>('stream', true),
      systemPrompt: cfg.get<string>(
        'systemPrompt',
        'You are Jay Gurudev AI, an expert AI coding assistant. You write clean, robust code and explain complex software engineering concepts clearly. You support both English and Bengali (বাংলা) fluently.'
      )
    };
  }

  public async sendPromptWithContext(promptText: string): Promise<void> {
    if (!this.view) {
      await vscode.commands.executeCommand('jayGurudev.chat.focus');
    }
    await this.handleUserMessage(promptText, true);
  }

  private async handleUserMessage(userText: string, includeContext?: boolean): Promise<void> {
    const editorCtx = includeContext
      ? this.workspaceService.getActiveEditorContext()
      : null;

    let fullPrompt = userText;
    if (editorCtx && editorCtx.selection) {
      fullPrompt += this.workspaceService.formatContextPrompt(editorCtx);
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: fullPrompt,
      timestamp: Date.now(),
      context: editorCtx || undefined
    };

    this.messages.push(userMessage);
    this.saveHistory();
    this.postMessage({ type: 'addMessage', message: userMessage });

    // Prepare assistant message
    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    };

    this.messages.push(assistantMessage);
    this.postMessage({ type: 'addMessage', message: assistantMessage });
    this.postMessage({ type: 'setLoading', isLoading: true });

    const config = this.getConfig();
    const apiKey = await this.secretService.getApiKey();

    let accumulatedText = '';

    await this.apiClient.sendChat(this.messages.slice(0, -1), config, apiKey, {
      onChunk: (chunk: string) => {
        accumulatedText += chunk;
        this.postMessage({
          type: 'updateMessageChunk',
          id: assistantId,
          chunk
        });
      },
      onFinish: (finalText: string) => {
        const textToSave = finalText || accumulatedText;
        assistantMessage.content = textToSave;
        assistantMessage.isStreaming = false;
        this.saveHistory();
        this.postMessage({
          type: 'finishMessage',
          id: assistantId,
          fullContent: textToSave
        });
      },
      onError: (err: Error) => {
        assistantMessage.isError = true;
        assistantMessage.content = err.message;
        assistantMessage.isStreaming = false;
        this.saveHistory();
        this.postMessage({
          type: 'messageError',
          id: assistantId,
          error: err.message
        });
      }
    });
  }

  public startNewChat(): void {
    this.apiClient.cancelCurrentRequest();
    this.messages = [];
    this.saveHistory();
    this.postMessage({ type: 'clearHistory' });
    this.postMessage({ type: 'setLoading', isLoading: false });
    vscode.window.showInformationMessage('Jay Gurudev AI: Started new conversation.');
  }

  public clearChatHistory(): void {
    this.startNewChat();
  }

  private saveHistory(): void {
    // Keep last 30 messages in history
    if (this.messages.length > 30) {
      this.messages = this.messages.slice(-30);
    }
    this.state.update('jayGurudev.chatHistory', this.messages);
  }

  private postMessage(msg: any): void {
    if (this.view) {
      this.view.webview.postMessage(msg);
    }
  }
}
