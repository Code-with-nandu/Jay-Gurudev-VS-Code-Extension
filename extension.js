
const vscode = require('vscode');

function activate(context) {
    const provider = {
        resolveWebviewView(webviewView) {
            webviewView.webview.options = {
                enableScripts: true
            };

            webviewView.webview.html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {
                            font-family: sans-serif;
                            padding: 15px;
                            color: var(--vscode-foreground);
                        }
                        h2 { color: #F59E0B; }
                        #messages {
                            height: 65vh;
                            overflow-y: auto;
                            margin-bottom: 12px;
                        }
                        input {
                            width: 95%;
                            padding: 10px;
                            margin-bottom: 8px;
                            color: var(--vscode-input-foreground);
                            background: var(--vscode-input-background);
                            border: 1px solid var(--vscode-input-border);
                        }
                        button {
                            padding: 9px 15px;
                            background: #F59E0B;
                            color: black;
                            border: none;
                            cursor: pointer;
                        }
                    </style>
                </head>
                <body>
                    <h2>🙏 Jay Gurudev AI</h2>
                    <p>Your AI Coding Assistant</p>
                    <div id="messages">
                        <p>Welcome! How can I help you?</p>
                    </div>
                    <input id="message" placeholder="Ask Jay Gurudev..." />
                    <button onclick="sendMessage()">Send</button>

                    <script>
                        const vscode = acquireVsCodeApi();

                        function sendMessage() {
                            const input = document.getElementById('message');
                            if (!input.value.trim()) return;

                            vscode.postMessage({
                                text: input.value
                            });
                            input.value = '';
                        }

                        window.addEventListener('message', event => {
                            const p = document.createElement('p');
                            p.textContent = event.data.text;
                            document.getElementById('messages').appendChild(p);
                        });
                    </script>
                </body>
                </html>
            `;

            webviewView.webview.onDidReceiveMessage(message => {
                webviewView.webview.postMessage({
                    text: 'Message received: ' + message.text +
                          ' | AI connection will be added in Step 4.'
                });
            });
        }
    };

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'jayGurudev.chat',
            provider
        )
    );
}

function deactivate() {}

module.exports = { activate, deactivate };
