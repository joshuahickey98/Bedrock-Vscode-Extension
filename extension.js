"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
function activate(context) {
    const disposable = vscode.commands.registerCommand('bedrock.start', async () => {
        const panel = vscode.window.createWebviewPanel('bedrockChat', 'AWS Bedrock Chat', vscode.ViewColumn.One, { enableScripts: true });
        panel.webview.html = getWebviewContent();
        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'chat') {
                const userPrompt = message.text;
                const maxTokens = 1024;
                const modelId = "";
                try {
                    const client = new client_bedrock_runtime_1.BedrockRuntimeClient({ region: "" });
                    if (modelId.startsWith("anthropic")) {
                        const command = new client_bedrock_runtime_1.InvokeModelWithResponseStreamCommand({
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
                    }
                    else {
                        const command = new client_bedrock_runtime_1.InvokeModelCommand({
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
                        }
                        else {
                            responseText = JSON.stringify(parsed, null, 2);
                        }
                        panel.webview.postMessage({ command: 'chatResponse', text: responseText });
                    }
                }
                catch (err) {
                    panel.webview.postMessage({ command: 'chatResponse', text: `Error: ${String(err)}` });
                }
            }
        });
    });
    context.subscriptions.push(disposable);
}
function getWebviewContent() {
    return /*html*/ `
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
function deactivate() { }
//# sourceMappingURL=extension.js.map