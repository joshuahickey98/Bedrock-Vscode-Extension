import * as vscode from 'vscode';
import { 
    BedrockRuntimeClient, 
    InvokeModelWithResponseStreamCommand 
} from "@aws-sdk/client-bedrock-runtime";

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('bedrock.start', async () => {
        const panel = vscode.window.createWebviewPanel(
            'bedrockChat',
            'AWS Bedrock Chat',
            vscode.ViewColumn.One,
            { 
                enableScripts: true,
                retainContextWhenHidden: true 
            }
        );

        const conversationHistory: Message[] = [];

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(async (message: any) => {
            if (message.command === 'chat') {
                const userPrompt = message.text;
                const config = vscode.workspace.getConfiguration('bedrock');
                const region = config.get<string>('region', 'us-east-1');
                const modelId = config.get<string>('modelId', 'anthropic.claude-3-5-sonnet-20241022-v2:0');
                const maxTokens = config.get<number>('maxTokens', 4096);

                // Add user message to history
                conversationHistory.push({ role: 'user', content: userPrompt });

                try {
                    panel.webview.postMessage({ command: 'startResponse' });

                    const client = new BedrockRuntimeClient({ region });

                    const command = new InvokeModelWithResponseStreamCommand({
                        modelId,
                        body: JSON.stringify({
                            anthropic_version: "bedrock-2023-05-31",
                            messages: conversationHistory,
                            max_tokens: maxTokens,
                        }),
                        contentType: "application/json",
                        accept: "application/json",
                    });

                    const response = await client.send(command);
                    let fullResponse = "";

                    if (response.body) {
                        for await (const event of response.body) {
                            if (event.chunk) {
                                const decoded = new TextDecoder().decode(event.chunk.bytes);
                                const parsed = JSON.parse(decoded);

                                if (parsed.delta && parsed.delta.text) {
                                    fullResponse += parsed.delta.text;
                                    panel.webview.postMessage({ 
                                        command: 'streamResponse', 
                                        text: parsed.delta.text 
                                    });
                                }
                            }
                        }
                    }

                    // Add assistant response to history
                    conversationHistory.push({ role: 'assistant', content: fullResponse });
                    panel.webview.postMessage({ command: 'endResponse' });

                } catch (err: any) {
                    // Sanitize error message to avoid exposing sensitive information
                    let errorMsg = 'Unable to connect to AWS Bedrock. ';
                    
                    if (err.name === 'CredentialsProviderError' || err.message?.includes('credentials')) {
                        errorMsg += 'Please ensure your AWS credentials are configured correctly. ' +
                                   'You can configure credentials via AWS CLI (aws configure), ' +
                                   'environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY), ' +
                                   'or ~/.aws/credentials file.';
                    } else if (err.name === 'AccessDeniedException' || err.message?.includes('AccessDenied')) {
                        errorMsg += 'Access denied. Please ensure you have Bedrock access enabled in your AWS account ' +
                                   'and the selected model is available in your region.';
                    } else if (err.$metadata?.httpStatusCode === 404) {
                        errorMsg += 'Model not found. Please check your model ID in the extension settings.';
                    } else {
                        // Generic error without exposing internal details
                        errorMsg += `${err.message || 'An unexpected error occurred'}`;
                    }
                    
                    panel.webview.postMessage({ 
                        command: 'error', 
                        text: errorMsg 
                    });
                    console.error('Bedrock API Error:', err);
                }
            } else if (message.command === 'clearChat') {
                // Clear conversation history to start a new conversation
                conversationHistory.length = 0;
            } else if (message.command === 'insertCode') {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    editor.edit(editBuilder => {
                        editBuilder.insert(editor.selection.active, message.text);
                    });
                }
            }
        });
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
    return /*html*/`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
                height: 100vh;
                display: flex;
                flex-direction: column;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }

            h2 {
                font-size: 18px;
                font-weight: 600;
                color: var(--vscode-foreground);
            }

            .header-buttons {
                display: flex;
                gap: 10px;
            }

            button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                font-family: var(--vscode-font-family);
                transition: background-color 0.2s;
            }

            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }

            button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            button.secondary {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
            }

            button.secondary:hover {
                background-color: var(--vscode-button-secondaryHoverBackground);
            }

            .chat-container {
                flex: 1;
                overflow-y: auto;
                margin-bottom: 20px;
                padding: 10px;
                background-color: var(--vscode-editor-background);
                border-radius: 6px;
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .message {
                display: flex;
                flex-direction: column;
                max-width: 85%;
                animation: fadeIn 0.3s ease-in;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .message.user {
                align-self: flex-end;
            }

            .message.assistant {
                align-self: flex-start;
            }

            .message-header {
                font-size: 11px;
                font-weight: 600;
                margin-bottom: 6px;
                opacity: 0.7;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .message.user .message-header {
                color: var(--vscode-terminal-ansiCyan);
            }

            .message.assistant .message-header {
                color: var(--vscode-terminal-ansiGreen);
            }

            .message-content {
                background-color: var(--vscode-input-background);
                padding: 12px 16px;
                border-radius: 8px;
                border: 1px solid var(--vscode-panel-border);
                white-space: pre-wrap;
                word-wrap: break-word;
                line-height: 1.6;
                font-size: 13px;
            }

            .message.user .message-content {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
            }

            .message.assistant .message-content {
                background-color: var(--vscode-editor-inactiveSelectionBackground);
            }

            .message-actions {
                display: flex;
                gap: 8px;
                margin-top: 6px;
            }

            .message-action-btn {
                background: transparent;
                color: var(--vscode-foreground);
                border: 1px solid var(--vscode-panel-border);
                padding: 4px 10px;
                font-size: 11px;
                border-radius: 3px;
                opacity: 0.7;
                transition: opacity 0.2s;
            }

            .message-action-btn:hover {
                opacity: 1;
                background-color: var(--vscode-list-hoverBackground);
            }

            .input-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
                padding: 15px;
                background-color: var(--vscode-input-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 6px;
            }

            .quick-prompts {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .quick-prompt {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background-color 0.2s;
            }

            .quick-prompt:hover {
                background-color: var(--vscode-button-secondaryHoverBackground);
            }

            textarea {
                width: 100%;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                padding: 12px;
                font-size: 13px;
                font-family: var(--vscode-font-family);
                resize: vertical;
                min-height: 80px;
            }

            textarea:focus {
                outline: none;
                border-color: var(--vscode-focusBorder);
            }

            textarea::placeholder {
                color: var(--vscode-input-placeholderForeground);
            }

            .button-row {
                display: flex;
                gap: 10px;
                align-items: center;
            }

            .loading {
                display: none;
                align-items: center;
                gap: 8px;
                color: var(--vscode-foreground);
                font-size: 12px;
                opacity: 0.8;
            }

            .loading.active {
                display: flex;
            }

            .spinner {
                width: 16px;
                height: 16px;
                border: 2px solid var(--vscode-panel-border);
                border-top-color: var(--vscode-button-background);
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            .error-message {
                background-color: var(--vscode-inputValidation-errorBackground);
                color: var(--vscode-inputValidation-errorForeground);
                border: 1px solid var(--vscode-inputValidation-errorBorder);
                padding: 12px;
                border-radius: 4px;
                margin-bottom: 15px;
                font-size: 13px;
            }

            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--vscode-foreground);
                opacity: 0.6;
                gap: 10px;
            }

            .empty-state-icon {
                font-size: 48px;
            }

            .empty-state-text {
                font-size: 14px;
            }

            code {
                background-color: var(--vscode-textCodeBlock-background);
                padding: 2px 6px;
                border-radius: 3px;
                font-family: var(--vscode-editor-font-family);
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h2>🤖 AWS Bedrock Chat Assistant</h2>
            <div class="header-buttons">
                <button id="clearBtn" class="secondary">Clear Chat</button>
            </div>
        </div>

        <div class="chat-container" id="chatContainer">
            <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                <div class="empty-state-text">Start a conversation with AWS Bedrock</div>
                <div class="empty-state-text" style="font-size: 12px; margin-top: -5px;">
                    Use quick prompts below or ask anything
                </div>
            </div>
        </div>

        <div class="input-container">
            <div class="quick-prompts">
                <button class="quick-prompt" data-prompt="Explain this code">📖 Explain Code</button>
                <button class="quick-prompt" data-prompt="Refactor this code to be more efficient">♻️ Refactor</button>
                <button class="quick-prompt" data-prompt="Add comments to this code">💬 Add Comments</button>
                <button class="quick-prompt" data-prompt="Find bugs in this code">🐛 Find Bugs</button>
                <button class="quick-prompt" data-prompt="Write unit tests for this code">✅ Write Tests</button>
            </div>
            
            <textarea 
                id="prompt" 
                rows="3" 
                placeholder="Ask anything... (e.g., 'Explain this function', 'How do I...', 'Refactor this code')"></textarea>
            
            <div class="button-row">
                <button id="askBtn">Send</button>
                <div class="loading" id="loading">
                    <div class="spinner"></div>
                    <span>Thinking...</span>
                </div>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const chatContainer = document.getElementById('chatContainer');
            const promptInput = document.getElementById('prompt');
            const askBtn = document.getElementById('askBtn');
            const clearBtn = document.getElementById('clearBtn');
            const loading = document.getElementById('loading');

            let currentMessageDiv = null;
            let isStreaming = false;

            // Handle quick prompts
            document.querySelectorAll('.quick-prompt').forEach(btn => {
                btn.addEventListener('click', () => {
                    const prompt = btn.getAttribute('data-prompt');
                    promptInput.value = prompt;
                    promptInput.focus();
                });
            });

            // Send message
            function sendMessage() {
                const text = promptInput.value.trim();
                if (!text || isStreaming) return;

                // Clear empty state
                const emptyState = chatContainer.querySelector('.empty-state');
                if (emptyState) {
                    emptyState.remove();
                }

                // Add user message
                addMessage('user', text);
                
                promptInput.value = '';
                askBtn.disabled = true;
                loading.classList.add('active');
                isStreaming = true;

                vscode.postMessage({ command: 'chat', text });
            }

            askBtn.addEventListener('click', sendMessage);
            
            promptInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });

            clearBtn.addEventListener('click', () => {
                chatContainer.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-state-icon">💬</div>
                        <div class="empty-state-text">Start a conversation with AWS Bedrock</div>
                    </div>
                \`;
                vscode.postMessage({ command: 'clearChat' });
            });

            // Add message to chat
            function addMessage(role, content) {
                const messageDiv = document.createElement('div');
                messageDiv.className = \`message \${role}\`;
                
                const headerDiv = document.createElement('div');
                headerDiv.className = 'message-header';
                headerDiv.textContent = role === 'user' ? 'You' : 'Assistant';
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'message-content';
                contentDiv.textContent = content;
                
                messageDiv.appendChild(headerDiv);
                messageDiv.appendChild(contentDiv);

                // Add action buttons for assistant messages
                if (role === 'assistant') {
                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'message-actions';
                    
                    const copyBtn = document.createElement('button');
                    copyBtn.className = 'message-action-btn';
                    copyBtn.textContent = '📋 Copy';
                    copyBtn.onclick = () => {
                        navigator.clipboard.writeText(content);
                        copyBtn.textContent = '✅ Copied!';
                        setTimeout(() => copyBtn.textContent = '📋 Copy', 2000);
                    };
                    
                    const insertBtn = document.createElement('button');
                    insertBtn.className = 'message-action-btn';
                    insertBtn.textContent = '📝 Insert to Editor';
                    insertBtn.onclick = () => {
                        vscode.postMessage({ command: 'insertCode', text: content });
                        insertBtn.textContent = '✅ Inserted!';
                        setTimeout(() => insertBtn.textContent = '📝 Insert to Editor', 2000);
                    };
                    
                    actionsDiv.appendChild(copyBtn);
                    actionsDiv.appendChild(insertBtn);
                    messageDiv.appendChild(actionsDiv);
                }
                
                chatContainer.appendChild(messageDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;
                
                return messageDiv;
            }

            // Handle messages from extension
            window.addEventListener('message', event => {
                const { command, text } = event.data;
                
                if (command === 'startResponse') {
                    currentMessageDiv = addMessage('assistant', '');
                }
                else if (command === 'streamResponse') {
                    if (currentMessageDiv) {
                        const contentDiv = currentMessageDiv.querySelector('.message-content');
                        contentDiv.textContent += text;
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                }
                else if (command === 'endResponse') {
                    currentMessageDiv = null;
                    askBtn.disabled = false;
                    loading.classList.remove('active');
                    isStreaming = false;
                }
                else if (command === 'error') {
                    if (currentMessageDiv) {
                        currentMessageDiv.remove();
                    }
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message';
                    errorDiv.textContent = text;
                    chatContainer.appendChild(errorDiv);
                    
                    askBtn.disabled = false;
                    loading.classList.remove('active');
                    isStreaming = false;
                }
            });

            // Focus on input on load
            promptInput.focus();
        </script>
    </body>
    </html>
    `;
}

export function deactivate() {}
