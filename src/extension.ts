import * as vscode from 'vscode';
import { JayGurudevChatViewProvider } from './providers/chatViewProvider';
import { SecretService } from './services/secretStorage';
import { WorkspaceContextService } from './services/workspaceContext';

export function activate(context: vscode.ExtensionContext): void {
  const secretService = new SecretService(context.secrets);
  const workspaceService = new WorkspaceContextService();

  const provider = new JayGurudevChatViewProvider(
    context.extensionUri,
    secretService,
    workspaceService,
    context.workspaceState
  );

  // Register the Sidebar Webview View Provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      JayGurudevChatViewProvider.viewType,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    )
  );

  // Register Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('jayGurudev.openChat', async () => {
      await vscode.commands.executeCommand('jayGurudev.chat.focus');
    }),

    vscode.commands.registerCommand('jayGurudev.newChat', () => {
      provider.startNewChat();
    }),

    vscode.commands.registerCommand('jayGurudev.clearChat', () => {
      provider.clearChatHistory();
    }),

    vscode.commands.registerCommand('jayGurudev.setApiKey', async () => {
      await secretService.promptSetApiKey();
    }),

    vscode.commands.registerCommand('jayGurudev.explainCode', async () => {
      const editorCtx = workspaceService.getActiveEditorContext();
      if (!editorCtx?.selection) {
        vscode.window.showInformationMessage('Please select some code to explain.');
        return;
      }
      await vscode.commands.executeCommand('jayGurudev.chat.focus');
      await provider.sendPromptWithContext(
        'Please explain this code clearly step-by-step. Mention any key concepts, architecture, and logic.'
      );
    }),

    vscode.commands.registerCommand('jayGurudev.refactorCode', async () => {
      const editorCtx = workspaceService.getActiveEditorContext();
      if (!editorCtx?.selection) {
        vscode.window.showInformationMessage('Please select some code to refactor.');
        return;
      }
      await vscode.commands.executeCommand('jayGurudev.chat.focus');
      await provider.sendPromptWithContext(
        'Refactor this code to improve clarity, performance, and maintainability. Follow industry best practices and explain the improvements.'
      );
    }),

    vscode.commands.registerCommand('jayGurudev.debugCode', async () => {
      const editorCtx = workspaceService.getActiveEditorContext();
      if (!editorCtx?.selection) {
        vscode.window.showInformationMessage('Please select some code to debug.');
        return;
      }
      await vscode.commands.executeCommand('jayGurudev.chat.focus');
      await provider.sendPromptWithContext(
        'Analyze this code for potential bugs, logical errors, edge cases, and performance bottlenecks. Suggest concrete fixes.'
      );
    }),

    vscode.commands.registerCommand('jayGurudev.generateCode', async () => {
      const userInput = await vscode.window.showInputBox({
        title: 'Jay Gurudev AI: Generate Code',
        prompt: 'Describe the function, component, or algorithm you want to generate (English or বাংলা):',
        placeHolder: 'e.g., Create a TypeScript function to debounce an API call'
      });

      if (!userInput || userInput.trim().length === 0) {
        return;
      }

      await vscode.commands.executeCommand('jayGurudev.chat.focus');
      await provider.sendPromptWithContext(`Generate code for the following requirement: ${userInput.trim()}`);
    })
  );
}

export function deactivate(): void {}
