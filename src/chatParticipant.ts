/**
 * Chat participant implementation for @human.
 * 
 * Provides slash commands:
 *   /input    - Get text/number input
 *   /choice   - Present choices to user
 *   /multiline - Get multi-line text
 *   /confirm  - Yes/No confirmation
 *   /info     - Show information message
 *   /health   - Health check
 */

import * as vscode from 'vscode';
import {
  executeGetUserInput,
  executeGetUserChoice,
  executeGetMultilineInput,
  executeShowConfirmation,
  executeShowInfoMessage,
  executeHealthCheck,
} from './tools';

const PARTICIPANT_ID = 'human-in-the-loop.human';

/**
 * Handle the /input command.
 * Parses the user's prompt to extract parameters and shows an input box.
 */
export async function handleInputCommand(
  request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<void> {
  const userPrompt = request.prompt.trim() || 'Please provide your input';

  stream.markdown('Opening input dialog...\n\n');

  const result = await executeGetUserInput(
    {
      title: 'User Input',
      prompt: userPrompt,
      inputType: 'text',
    },
    token
  );

  if (result.success) {
    stream.markdown(`**User provided:** ${result.user_input}\n`);
  } else if (result.cancelled) {
    stream.markdown('*Input was cancelled by user.*\n');
  } else {
    stream.markdown(`**Error:** ${result.error}\n`);
  }
}

/**
 * Handle the /choice command.
 * Parses comma-separated choices from the prompt.
 */
export async function handleChoiceCommand(
  request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<void> {
  const userPrompt = request.prompt.trim();

  if (!userPrompt) {
    stream.markdown(
      'Please provide choices separated by commas.\n\n' +
      'Example: `@human /choice React, Vue, Angular`\n'
    );
    return;
  }

  // Parse choices: split by comma
  const parts = userPrompt.split(',').map((s) => s.trim()).filter((s) => s.length > 0);

  if (parts.length < 2) {
    stream.markdown(
      'Please provide at least 2 choices separated by commas.\n\n' +
      'Example: `@human /choice React, Vue, Angular`\n'
    );
    return;
  }

  stream.markdown(`Presenting ${parts.length} choices...\n\n`);

  const result = await executeGetUserChoice(
    {
      title: 'User Choice',
      prompt: `Select from: ${parts.join(', ')}`,
      choices: parts,
      allowMultiple: false,
    },
    token
  );

  if (result.success) {
    stream.markdown(`**User selected:** ${result.selected_choice}\n`);
  } else if (result.cancelled) {
    stream.markdown('*Selection was cancelled by user.*\n');
  } else {
    stream.markdown(`**Error:** ${result.error}\n`);
  }
}

/**
 * Handle the /multiline command.
 */
export async function handleMultilineCommand(
  request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<void> {
  const userPrompt = request.prompt.trim() || 'Please provide your detailed input';

  stream.markdown('Opening multi-line editor...\n\n');

  const result = await executeGetMultilineInput(
    {
      title: 'Multi-line Input',
      prompt: userPrompt,
    },
    token
  );

  if (result.success) {
    stream.markdown(
      `**User provided** (${result.character_count} chars, ${result.line_count} lines):\n\n` +
      '```\n' + result.user_input + '\n```\n'
    );
  } else if (result.cancelled) {
    stream.markdown('*Multi-line input was cancelled by user.*\n');
  } else {
    stream.markdown(`**Error:** ${result.error}\n`);
  }
}

/**
 * Handle the /confirm command.
 */
export async function handleConfirmCommand(
  request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<void> {
  const message = request.prompt.trim() || 'Do you want to proceed?';

  stream.markdown('Showing confirmation dialog...\n\n');

  const result = await executeShowConfirmation(
    {
      title: 'Confirmation',
      message,
    },
    token
  );

  if (result.success) {
    stream.markdown(
      result.confirmed
        ? '**User confirmed:** Yes ✓\n'
        : '**User declined:** No ✗\n'
    );
  } else {
    stream.markdown(`**Error:** ${result.error}\n`);
  }
}

/**
 * Handle the /info command.
 */
export async function handleInfoCommand(
  request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<void> {
  const message = request.prompt.trim();

  if (!message) {
    stream.markdown('Please provide a message to display.\n\nExample: `@human /info Task completed successfully!`\n');
    return;
  }

  const result = await executeShowInfoMessage(
    {
      title: 'Information',
      message,
    },
    token
  );

  if (result.success) {
    stream.markdown(
      result.acknowledged
        ? 'Message acknowledged by user. ✓\n'
        : 'Message was dismissed.\n'
    );
  } else {
    stream.markdown(`**Error:** ${result.error}\n`);
  }
}

/**
 * Handle the /health command.
 */
export async function handleHealthCommand(
  stream: vscode.ChatResponseStream
): Promise<void> {
  const result = await executeHealthCheck();

  stream.markdown(
    `## Health Check\n\n` +
    `| Property | Value |\n` +
    `|----------|-------|\n` +
    `| Status | ${result.status} |\n` +
    `| Platform | ${result.platform} |\n` +
    `| Architecture | ${result.platform_details.arch} |\n` +
    `| WSL | ${result.platform_details.isWSL ? 'Yes' : 'No'} |\n` +
    `| Version | ${result.extension_version} |\n` +
    `| Tools | ${result.tools_available.length} available |\n\n` +
    `**Available tools:** ${result.tools_available.map((t) => '`' + t + '`').join(', ')}\n`
  );
}

/**
 * Main request handler for the @human chat participant.
 */
export function createRequestHandler(): vscode.ChatRequestHandler {
  return async (
    request: vscode.ChatRequest,
    _context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<vscode.ChatResult> => {
    switch (request.command) {
      case 'input':
        await handleInputCommand(request, stream, token);
        break;
      case 'choice':
        await handleChoiceCommand(request, stream, token);
        break;
      case 'multiline':
        await handleMultilineCommand(request, stream, token);
        break;
      case 'confirm':
        await handleConfirmCommand(request, stream, token);
        break;
      case 'info':
        await handleInfoCommand(request, stream, token);
        break;
      case 'health':
        await handleHealthCommand(stream);
        break;
      default:
        if (request.prompt.trim()) {
          // User typed @human with a prompt but no slash command.
          // Auto-invoke simple input so user can respond quickly.
          await handleInputCommand(request, stream, token);
        } else {
          // No command and no prompt — show help
          stream.markdown(
            '## @human — Human in the Loop\n\n' +
            '### Quick Start\n\n' +
            'Type `@human` followed by your question to open a multi-line editor:\n' +
            '```\n@human What requirements do you have?\n```\n\n' +
            '### Slash Commands\n\n' +
            '| Command | Description |\n' +
            '|---------|-------------|\n' +
            '| `/input [prompt]` | Ask for text/number input |\n' +
            '| `/choice item1, item2, ...` | Present choices |\n' +
            '| `/multiline [prompt]` | Ask for multi-line text |\n' +
            '| `/confirm [message]` | Yes/No confirmation |\n' +
            '| `/info [message]` | Show information message |\n' +
            '| `/health` | Check extension health |\n\n' +
            '### Using with Copilot\n\n' +
            '**Agent Mode (recommended):** Switch to Agent mode and Copilot will ' +
            'automatically call human-in-the-loop tools when it needs your input.\n\n' +
            '**Chat Mode:** Reference tools with `#` in your prompt:\n' +
            '- `#human_getUserInput` — text/number input\n' +
            '- `#human_getUserChoice` — choice selection\n' +
            '- `#human_getMultilineInput` — multi-line editor\n' +
            '- `#human_showConfirmation` — yes/no confirmation\n' +
            '- `#human_showInfoMessage` — info notification\n' +
            '- `#human_healthCheck` — health status\n\n' +
            'Example: *"Build a website and use #human_getUserChoice to ask which framework I want."*\n'
          );
        }
        break;
    }

    return {};
  };
}

/**
 * Register the @human chat participant.
 */
export function registerChatParticipant(
  context: vscode.ExtensionContext
): void {
  const handler = createRequestHandler();
  const participant = vscode.chat.createChatParticipant(PARTICIPANT_ID, handler);
  participant.iconPath = new vscode.ThemeIcon('person');
  context.subscriptions.push(participant);
}
