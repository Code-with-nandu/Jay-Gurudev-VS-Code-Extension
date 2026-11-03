import * as vscode from 'vscode';

const API_KEY_SECRET = 'jayGurudev.apiKey';

export class SecretService {
  constructor(private readonly secrets: vscode.SecretStorage) {}

  async getApiKey(): Promise<string | undefined> {
    try {
      return await this.secrets.get(API_KEY_SECRET);
    } catch {
      return undefined;
    }
  }

  async setApiKey(key: string): Promise<void> {
    await this.secrets.store(API_KEY_SECRET, key.trim());
  }

  async deleteApiKey(): Promise<void> {
    await this.secrets.delete(API_KEY_SECRET);
  }

  async hasApiKey(): Promise<boolean> {
    const key = await this.getApiKey();
    return !!key && key.trim().length > 0;
  }

  async promptSetApiKey(): Promise<boolean> {
    const key = await vscode.window.showInputBox({
      title: 'Jay Gurudev AI: Set API Key',
      prompt: 'Enter your API key / authorization token for the JayGurudev model server',
      password: true,
      ignoreFocusOut: true,
      placeHolder: 'Paste your secret token here'
    });

    if (key !== undefined) {
      if (key.trim().length === 0) {
        await this.deleteApiKey();
        vscode.window.showInformationMessage('Jay Gurudev AI: API key removed.');
      } else {
        await this.setApiKey(key.trim());
        vscode.window.showInformationMessage('Jay Gurudev AI: API key stored securely in SecretStorage.');
      }
      return true;
    }
    return false;
  }
}
