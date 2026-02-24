# Human-in-the-Loop VS Code Extension

A production-grade VS Code extension that enables AI assistants like GitHub Copilot to interact with humans through native VS Code UI dialogs. This bridges the gap between automated AI processes and human decision-making.

Based on the [Human-In-the-Loop MCP Server](https://github.com/GongRzhe/Human-In-the-Loop-MCP-Server), re-implemented as a native VS Code extension using the Chat Tools API.

## Features

### Chat Tools (accessible from GitHub Copilot)

| Tool | Description |
|------|-------------|
| `human_getUserInput` | Single-line text/number input via VS Code InputBox |
| `human_getUserChoice` | Multiple choice selection via VS Code QuickPick |
| `human_getMultilineInput` | Multi-line text via temporary document editor |
| `human_showConfirmation` | Yes/No modal confirmation dialog |
| `human_showInfoMessage` | Information notification message |
| `human_healthCheck` | Extension status and platform information |

### `@human` Chat Participant with Slash Commands

| Command | Description |
|---------|-------------|
| `@human /input [prompt]` | Ask for text/number input |
| `@human /choice item1, item2, ...` | Present choices to pick from |
| `@human /multiline [prompt]` | Open multi-line text editor |
| `@human /confirm [message]` | Yes/No confirmation dialog |
| `@human /info [message]` | Display a notification |
| `@human /health` | Check extension health |

### Cross-Platform Support

- **Windows** — Native VS Code UI on Windows 10/11
- **macOS** — Full support on Intel and Apple Silicon
- **Linux** — Compatible with all major distributions
- **WSL** — Detected and supported as a distinct platform

## Installation

### From VSIX

```bash
code --install-extension human-in-the-loop-1.0.0.vsix
```

### Development

```bash
git clone <repo-url>
cd vscode-human-input
npm install
npm run compile
# Press F5 in VS Code to launch Extension Development Host
```

## Usage

There are **three ways** to use this extension, depending on how you interact with Copilot:

### 1. Agent Mode (Recommended — Automatic Tool Calling)

In **Agent mode** (the agentic coding experience), Copilot **automatically discovers and calls** the tools when it needs user input. No special syntax required:

1. Open Copilot Chat and switch to **Agent mode** (click the mode selector or use the dropdown)
2. Ask Copilot to do something that requires your input
3. Copilot will automatically call the appropriate tool to ask you

> **Example prompt:** "Build me a Go web app. Ask me which framework and database I want to use."
>
> Copilot will call `human_getUserChoice` to present framework options, then again for database options.

### 2. Chat Mode with `#` Tool References (Explicit)

In **Chat mode** (the default conversation mode), Copilot only uses tools that you explicitly reference with `#`:

| Reference | What it does |
|-----------|--------------|
| `#human_getUserInput` | Ask user for text/number input |
| `#human_getUserChoice` | Present choices to pick from |
| `#human_getMultilineInput` | Open multi-line text editor |
| `#human_showConfirmation` | Ask for yes/no confirmation |
| `#human_showInfoMessage` | Show a notification message |
| `#human_healthCheck` | Check extension health |

> **Example prompt:** "Plan a website for me but use #human_getUserChoice to ask what framework I prefer."

### 3. `@human` Chat Participant with `/` Slash Commands (Direct)

You can invoke dialogs directly via the `@human` chat participant:

| Command | Example |
|---------|---------|
| `@human /input What is your name?` | Text input dialog |
| `@human /choice React, Vue, Angular` | Choice picker |
| `@human /multiline Describe your requirements` | Multi-line editor |
| `@human /confirm Delete all test data?` | Yes/No dialog |
| `@human /info Build completed successfully!` | Info notification |
| `@human /health` | Extension health check |

### Which Mode Should I Use?

| Mode | Best For |
|------|----------|
| **Agent mode** | Autonomous coding sessions where Copilot decides _when_ to ask |
| **Chat `#` references** | Telling Copilot exactly _which_ tool to use in a conversation |
| **`@human /command`** | Directly invoking a dialog without involving the LLM |

### Example Interactions

- **Copilot needs a file path** → calls `human_getUserInput`
- **Copilot offers framework choices** → calls `human_getUserChoice`
- **Copilot needs detailed feedback** → calls `human_getMultilineInput`
- **Copilot wants to confirm deletion** → calls `human_showConfirmation`
- **Copilot reports task completion** → calls `human_showInfoMessage`

## Response Format

All tools return structured JSON:

```json
{
  "success": true,
  "cancelled": false,
  "platform": "Windows",
  ...tool-specific fields
}
```

## Development

```bash
npm install          # Install dependencies
npm run compile      # Build the extension
npm test             # Run tests with coverage
npm run package      # Create VSIX package
```

## Testing

```bash
npm test             # Run all tests with coverage report
npm run test:watch   # Run tests in watch mode
```

Target: 80% code coverage across all metrics.

## License

MIT
