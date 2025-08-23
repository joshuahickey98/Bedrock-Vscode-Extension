# AWS Bedrock VS Code Extension

This is a simple VS Code extension that lets you chat with **Amazon Bedrock models** directly inside your editor.  
It provides a lightweight chat interface where you can type a prompt, send it to a Bedrock model (e.g., Claude 3 Sonnet), and view the response in real time.

---

## Features
- Open a chat panel inside VS Code (`AWS Bedrock Chat`).
- Send prompts to a Bedrock model from within the editor.
- Stream responses for supported models (e.g., Claude 3 Haiku, Sonnet, Opus).
- Configurable **max token** limit to prevent responses being cut off.
- Clean, minimal chat UI built with VS Code Webviews.

---

## Usage

1. **Install dependencies**

```bash
npm install
```

2. **Compile the extension**

```bash
npm run compile
```

3. **Launch the extension**

Open this project in VS Code and press `F5` to start a new **Extension Development Host** window.

4. **Run the command**

- Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).  
- Search for `AWS Bedrock Chat` and run it.  
- A new panel will appear where you can type prompts and see responses.

---

## Features

- Open a chat panel inside VS Code (`AWS Bedrock Chat`)  
- Send prompts to a Bedrock model from within the editor  
- Stream responses for supported models (e.g., Claude 3 Haiku, Sonnet, Opus)  
- Configurable **max token** limit to prevent responses being cut off  
- Clean, minimal chat UI built with VS Code Webviews

---

## Requirements

- AWS credentials configured (`~/.aws/credentials` or environment variables)  
- Access to Amazon Bedrock in your AWS account  
- A Bedrock-supported model ID (default is Claude 3 Sonnet)

Example models:

- `anthropic.claude-3-haiku-20240307-v1:0`  
- `anthropic.claude-3-sonnet-20240229-v1:0`  
- `anthropic.claude-3-opus-20240229-v1:0`

---

## Configuration

- **Model ID** inside `extension.ts` (default: Claude 3 Sonnet)  
- **Max tokens** (default: 1024)

---

## Packaging

```bash
npm install -g @vscode/vsce
vsce package
```

This generates a `.vsix` file you can install by dragging it into VS Code’s Extensions panel.
