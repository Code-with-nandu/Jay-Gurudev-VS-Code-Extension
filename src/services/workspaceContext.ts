import * as vscode from 'vscode';
import * as path from 'path';
import { CodeContext } from '../types';

export class WorkspaceContextService {
  getActiveEditorContext(): CodeContext | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return null;
    }

    const document = editor.document;
    const selection = editor.selection;
    const selectedText = document.getText(selection);

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    const relativePath = workspaceFolder
      ? path.relative(workspaceFolder.uri.fsPath, document.uri.fsPath)
      : path.basename(document.uri.fsPath);

    return {
      file: relativePath,
      language: document.languageId,
      selection: selectedText.trim().length > 0 ? selectedText : undefined,
      startLine: selection.start.line + 1,
      endLine: selection.end.line + 1
    };
  }

  async readFileWithPermission(targetPath: string): Promise<{ success: boolean; content?: string; error?: string }> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return { success: false, error: 'No workspace folder is open.' };
    }

    const rootUri = workspaceFolders[0].uri;
    const resolvedUri = path.isAbsolute(targetPath)
      ? vscode.Uri.file(targetPath)
      : vscode.Uri.joinPath(rootUri, targetPath);

    const relativeDisplay = path.relative(rootUri.fsPath, resolvedUri.fsPath);

    // Strict safety check: Require explicit user approval before reading
    const choice = await vscode.window.showWarningMessage(
      `Jay Gurudev AI requests permission to read: "${relativeDisplay}"`,
      { modal: true },
      'Allow',
      'Deny'
    );

    if (choice !== 'Allow') {
      return { success: false, error: 'User denied file access permission.' };
    }

    try {
      const fileBytes = await vscode.workspace.fs.readFile(resolvedUri);
      const content = Buffer.from(fileBytes).toString('utf-8');
      return { success: true, content };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Failed to read file: ${errorMsg}` };
    }
  }

  async applyCodeToEditor(code: string): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('Jay Gurudev AI: No active editor to apply code.');
      return false;
    }

    const choice = await vscode.window.showInformationMessage(
      'Apply AI generated code to the current editor?',
      'Apply at Selection/Cursor',
      'Cancel'
    );

    if (choice !== 'Apply at Selection/Cursor') {
      return false;
    }

    return await editor.edit(editBuilder => {
      if (!editor.selection.isEmpty) {
        editBuilder.replace(editor.selection, code);
      } else {
        editBuilder.insert(editor.selection.active, code);
      }
    });
  }

  async createNewFileWithApproval(suggestedName: string, content: string): Promise<boolean> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('Jay Gurudev AI: No workspace folder open to create file.');
      return false;
    }

    const choice = await vscode.window.showInformationMessage(
      `Allow Jay Gurudev AI to create file: "${suggestedName}"?`,
      'Create File',
      'Cancel'
    );

    if (choice !== 'Create File') {
      return false;
    }

    try {
      const targetUri = vscode.Uri.joinPath(workspaceFolders[0].uri, suggestedName);
      const data = Buffer.from(content, 'utf-8');
      await vscode.workspace.fs.writeFile(targetUri, data);

      const doc = await vscode.workspace.openTextDocument(targetUri);
      await vscode.window.showTextDocument(doc);
      vscode.window.showInformationMessage(`File created: ${suggestedName}`);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(`Failed to create file: ${msg}`);
      return false;
    }
  }

  formatContextPrompt(context: CodeContext | null): string {
    if (!context || !context.selection) {
      return '';
    }

    return (
      `\n\n--- Context ---\n` +
      `File: ${context.file ?? 'unknown'} (${context.language ?? 'text'})\n` +
      `Lines: ${context.startLine}-${context.endLine}\n` +
      `\`\`\`${context.language ?? ''}\n` +
      `${context.selection}\n` +
      `\`\`\`\n`
    );
  }
}
