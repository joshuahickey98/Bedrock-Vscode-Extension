import * as vscode from 'vscode';
import { 
    BedrockRuntimeClient, 
    InvokeModelCommand, 
    InvokeModelWithResponseStreamCommand 
} from "@aws-sdk/client-bedrock-runtime";

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('bedrock.start', async () => {
        const panel = vscode.window.createWebviewPanel(
            'bedrockChat',
            'AWS Bedrock Chat',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(async (message: any) => {
            if (message.command === 'chat') {
                const userPrompt = message.text;
                const maxTokens = 1024;
                const modelId = "";

                try {
                    const client = new BedrockRuntimeClient({ region: "" });

                    if (modelId.startsWith("anthropic")) {
                        const command = new InvokeModelWithResponseStreamCommand({
                            modelId,
                            body: JSON.stringify({
                                anthropic_version: "bedrock-2023-05-31",
                                messages: [{ role: "user", content: userPrompt }],
                                max_tokens: maxTokens,
                            }),
                            contentType: "application/json",
                            accept: "application/json",
                        });

                        const response = await client.send(command);

                        for await (const event of response.body) {
                            if (event.chunk) {
                                const decoded = new TextDecoder().decode(event.chunk.bytes);
                                const parsed = JSON.parse(decoded);

                                if (parsed.delta && parsed.delta.text) {
                                    panel.webview.postMessage({ command: 'chatResponse', text: parsed.delta.text });
                                }
                            }
                        }
                    } else {
                        const command = new InvokeModelCommand({
                            modelId,
                            body: JSON.stringify({
                                messages: [{ role: "user", content: userPrompt }],
                                max_tokens: maxTokens,
                            }),
                            contentType: "application/json",
                            accept: "application/json",
                        });

                        const response = await client.send(command);
                        const decoded = new TextDecoder().decode(response.body);
                        const parsed = JSON.parse(decoded);

                        let responseText = "";

                        if (parsed.content && parsed.content.length > 0 && parsed.content[0].text) {
                            responseText = parsed.content[0].text;
                        } else {
                            responseText = JSON.stringify(parsed, null, 2);
                        }

                        panel.webview.postMessage({ command: 'chatResponse', text: responseText });
                    }
                } catch (err) {
                    panel.webview.postMessage({ command: 'chatResponse', text: `Error: ${String(err)}` });
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
        <style>
            body { font-family: sans-serif; margin: 1rem; }
            #prompt { width: 100%; box-sizing: border-box; font-size: 14px; }
            #response { border: 1px solid #ccc; margin-top: 1rem; padding: 0.5rem; white-space: pre-wrap; }
            button { margin-top: 0.5rem; padding: 0.4rem 0.8rem; font-size: 14px; }
        </style>
    </head>
    <body>
        <h2>AWS Bedrock VS Code Extension</h2>
        <textarea id="prompt" rows="5" placeholder="Ask something..."></textarea><br />
        <button id="askBtn">Ask</button>
        <div id="response"></div>

        <script>
            const vscode = acquireVsCodeApi();
            let buffer = "";

            document.getElementById('askBtn').addEventListener('click', () => {
                const text = document.getElementById('prompt').value;
                buffer = ""; // reset
                document.getElementById('response').innerText = "";
                vscode.postMessage({ command: 'chat', text });
            });

            window.addEventListener('message', event => {
                const { command, text } = event.data;
                if (command === 'chatResponse') {
                    buffer += text;
                    document.getElementById('response').innerText = buffer;
                }
            });
        </script>
    </body>
    </html>
    `;
}

export function deactivate() {}
