import { ChatMessage, ExtensionConfig } from '../types';

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onError: (error: Error) => void;
  onFinish: (fullText: string) => void;
}

export class JayGurudevApiClient {
  private abortController: AbortController | null = null;

  cancelCurrentRequest(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async sendChat(
    history: ChatMessage[],
    config: ExtensionConfig,
    apiKey: string | undefined,
    callbacks: StreamCallbacks
  ): Promise<void> {
    this.cancelCurrentRequest();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const base = config.baseUrl.trim().replace(/\/+$/, '');
    const endpoint = base.endsWith('/v1')
      ? `${base}/chat/completions`
      : `${base}/v1/chat/completions`;

    // Format OpenAI messages
    const messages: Array<{ role: string; content: string }> = [];

    if (config.systemPrompt && config.systemPrompt.trim().length > 0) {
      messages.push({
        role: 'system',
        content: config.systemPrompt.trim()
      });
    }

    for (const msg of history) {
      if (msg.isError) {
        continue;
      }
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: config.stream ? 'text/event-stream, application/json' : 'application/json'
    };

    if (apiKey && apiKey.trim().length > 0) {
      const headerName = config.apiKeyHeader || 'x-api-key';
      headers[headerName] = apiKey.trim();
    }

    const payload = {
      model: config.model || 'jayGurudev',
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 4096,
      stream: config.stream ?? true
    };

    try {
      let response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal
      });

      // Fallback: If 404, try without /v1
      if (response.status === 404 && endpoint.includes('/v1/chat/completions')) {
        const altEndpoint = `${base}/chat/completions`;
        const altResponse = await fetch(altEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal
        });
        if (altResponse.ok) {
          response = altResponse;
        }
      }

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errJson: any = await response.json();
          errorDetail = errJson?.error?.message || JSON.stringify(errJson);
        } catch {
          errorDetail = await response.text().catch(() => '');
        }

        if (response.status === 401 || response.status === 403) {
          throw new Error(
            `Authentication failed (${response.status}). Please check your API key for header "${config.apiKeyHeader}". ${errorDetail}`
          );
        }
        if (response.status === 404) {
          throw new Error(
            `Endpoint not found (404) at ${endpoint}. Please verify your Base URL in Jay Gurudev settings.`
          );
        }

        throw new Error(
          `JayGurudev Server returned HTTP ${response.status}: ${errorDetail || response.statusText}`
        );
      }

      if (config.stream && response.body) {
        await this.handleStream(response.body, callbacks, signal);
      } else {
        const data: any = await response.json();
        const content =
          data?.choices?.[0]?.message?.content ||
          data?.choices?.[0]?.text ||
          data?.response ||
          '';
        callbacks.onChunk(content);
        callbacks.onFinish(content);
      }
    } catch (err: unknown) {
      if (signal.aborted) {
        // User aborted intentionally
        callbacks.onFinish('');
        return;
      }
      const error = err instanceof Error ? err : new Error(String(err));
      callbacks.onError(error);
    } finally {
      this.abortController = null;
    }
  }

  private async handleStream(
    body: ReadableStream<Uint8Array>,
    callbacks: StreamCallbacks,
    signal: AbortSignal
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedContent = '';

    try {
      while (!signal.aborted) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line || line.startsWith(':')) {
            // Keep-alive comment or empty line
            continue;
          }

          if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            if (dataStr === '[DONE]') {
              callbacks.onFinish(accumulatedContent);
              return;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                accumulatedContent += delta;
                callbacks.onChunk(delta);
              }
            } catch {
              // Non-JSON SSE line or partial chunk, skip
            }
          }
        }
      }

      callbacks.onFinish(accumulatedContent);
    } catch (err) {
      if (!signal.aborted) {
        throw err;
      }
    } finally {
      reader.releaseLock();
    }
  }
}
