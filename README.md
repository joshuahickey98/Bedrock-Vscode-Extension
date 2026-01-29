# AWS Bedrock VS Code Extension

A powerful VS Code extension that brings **Amazon Bedrock AI models** directly into your editor. Chat with Claude and other models, get code assistance, and boost your productivity with AI-powered features.

![AWS Bedrock Chat](https://img.shields.io/badge/AWS-Bedrock-orange) ![VS Code](https://img.shields.io/badge/VS%20Code-Extension-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

---

## ✨ Features

### 🎨 Modern Chat Interface
- **Beautiful UI** with VSCode theme integration (dark mode support)
- **Message bubbles** showing conversation history
- **Streaming responses** with real-time updates
- **Loading indicators** during AI processing
- **Empty state** with helpful guidance

### 🤖 AI-Powered Code Assistant
Quick prompt buttons for common coding tasks:
- 📖 **Explain Code** - Understand complex code snippets
- ♻️ **Refactor** - Improve code efficiency and structure
- 💬 **Add Comments** - Generate documentation
- 🐛 **Find Bugs** - Identify potential issues
- ✅ **Write Tests** - Create unit tests

### 💡 Smart Features
- **Conversation history** - Maintains context across messages
- **Copy responses** - One-click copy to clipboard
- **Insert to editor** - Directly insert AI responses into your code
- **Clear chat** - Start fresh conversations easily
- **Keyboard shortcuts** - Send with Enter (Shift+Enter for new line)

### ⚙️ Configurable Settings
Configure via VS Code settings:
- AWS region selection
- Model ID (Claude 3.5 Sonnet, Haiku, Opus, etc.)
- Max token limits

---

## 🚀 Getting Started

### Prerequisites

- **AWS Account** with Bedrock access
- **AWS Credentials** configured (`~/.aws/credentials` or environment variables)
- **Node.js** (v18 or higher)
- **VS Code** (v1.103 or higher)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/joshuahickey98/Bedrock-Vscode-Extension.git
cd Bedrock-Vscode-Extension
```

2. **Install dependencies**
```bash
npm install
```

3. **Compile the extension**
```bash
npm run compile
```

4. **Launch the extension**
- Open this project in VS Code
- Press `F5` to start a new **Extension Development Host** window

5. **Run the command**
- Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
- Search for `AWS Bedrock Chat` and run it
- A new panel will appear with the chat interface

---

## ⚙️ Configuration

Configure the extension via VS Code settings (`Settings > Extensions > AWS Bedrock`):

### Available Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `bedrock.region` | `us-east-1` | AWS region for Bedrock API |
| `bedrock.modelId` | `anthropic.claude-3-5-sonnet-20241022-v2:0` | Bedrock model ID to use |
| `bedrock.maxTokens` | `4096` | Maximum tokens for response |

### Supported Models

**Anthropic Claude 3.5:**
- `anthropic.claude-3-5-sonnet-20241022-v2:0` (Latest, recommended)

**Anthropic Claude 3:**
- `anthropic.claude-3-haiku-20240307-v1:0` (Fast, cost-effective)
- `anthropic.claude-3-sonnet-20240229-v1:0` (Balanced)
- `anthropic.claude-3-opus-20240229-v1:0` (Most capable)

### Example Configuration

Open VS Code settings.json:
```json
{
  "bedrock.region": "us-west-2",
  "bedrock.modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
  "bedrock.maxTokens": 4096
}
```

---

## 📖 Usage Examples

### General Chat
Type any question in the chat input and press Enter or click Send.

### Code Assistance
1. Click a quick prompt button (e.g., "Explain Code")
2. The prompt appears in the input
3. Add your code snippet or context
4. Send and get AI assistance

### Insert to Editor
1. Get a response from the AI
2. Click "📝 Insert to Editor" button
3. The response is inserted at your cursor position

---

## 🔧 Development

### Build Commands

```bash
# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Run linter
npm run lint

# Run tests
npm run test
```

### Project Structure

```
Bedrock-Vscode-Extension/
├── src/
│   └── extension.ts       # Main extension code
├── out/                   # Compiled JavaScript
├── package.json           # Extension manifest
├── tsconfig.json          # TypeScript configuration
└── README.md             # This file
```

---

## 📦 Packaging

To create a `.vsix` file for distribution:

```bash
npm install -g @vscode/vsce
vsce package
```

Install the generated `.vsix` file by dragging it into VS Code's Extensions panel.

---

## 🛠️ Requirements

- **AWS credentials** configured locally
- **Bedrock access** enabled in your AWS account
- **Model access** granted in Bedrock console
- **VS Code** 1.103.0 or higher

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📝 License

This project is open source and available under the MIT License.

---

## 🙏 Acknowledgments

- Built with AWS Bedrock Runtime SDK
- Powered by Anthropic's Claude models
- Designed for the VS Code ecosystem

---

## 📞 Support

If you encounter any issues or have questions:
1. Check AWS credentials are properly configured
2. Verify Bedrock model access in AWS console
3. Ensure the region setting matches your Bedrock access
4. Open an issue on GitHub for bugs or feature requests
