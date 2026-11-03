export type MessageRole = 'system' | 'user' | 'assistant';

export interface CodeContext {
  file?: string;
  language?: string;
  selection?: string;
  startLine?: number;
  endLine?: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  isError?: boolean;
  context?: CodeContext;
}

export interface ExtensionConfig {
  baseUrl: string;
  model: string;
  apiKeyHeader: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
  systemPrompt: string;
}

export type WebviewToExtensionMessage =
  | { type: 'sendMessage'; text: string; includeContext?: boolean }
  | { type: 'cancelStream' }
  | { type: 'newChat' }
  | { type: 'clearChat' }
  | { type: 'setApiKey' }
  | { type: 'openSettings' }
  | { type: 'insertCode'; code: string }
  | { type: 'applyToFile'; code: string; filePath?: string }
  | { type: 'readFileRequest'; filePath: string }
  | { type: 'ready' };

export type ExtensionToWebviewMessage =
  | { type: 'init'; messages: ChatMessage[]; hasApiKey: boolean; config: Partial<ExtensionConfig> }
  | { type: 'addMessage'; message: ChatMessage }
  | { type: 'updateMessageChunk'; id: string; chunk: string }
  | { type: 'finishMessage'; id: string; fullContent: string }
  | { type: 'messageError'; id: string; error: string }
  | { type: 'setLoading'; isLoading: boolean }
  | { type: 'clearHistory' }
  | { type: 'apiKeyStatus'; hasKey: boolean }
  | { type: 'activeContext'; context: CodeContext | null };
