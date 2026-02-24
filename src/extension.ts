/**
 * Human-in-the-Loop VS Code Extension
 *
 * Registers chat tools that enable GitHub Copilot (and other AI assistants)
 * to interact with humans through native VS Code UI dialogs.
 *
 * Tools: getUserInput, getUserChoice, getMultilineInput,
 *        showConfirmation, showInfoMessage, healthCheck
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
import { registerChatParticipant } from './chatParticipant';
import {
  formatUserInputResult,
  formatUserChoiceResult,
  formatMultilineInputResult,
  formatConfirmationResult,
  formatInfoMessageResult,
  formatHealthCheckResult,
} from './resultFormatter';
import type {
  UserInputResult,
  UserChoiceResult,
  MultilineInputResult,
  ConfirmationResult,
  InfoMessageResult,
  HealthCheckResult,
} from './types';

/**
 * Create a LanguageModelTool wrapper for a tool executor function.
 * Includes prepareInvocation for proper VS Code Copilot tool invocation flow.
 * Uses a formatter to return human-readable text instead of raw JSON.
 */
function createTool<TResult>(
  executor: (
    params: Record<string, unknown>,
    token: vscode.CancellationToken
  ) => Promise<TResult>,
  invocationMessage: string,
  formatter: (result: TResult) => string
): vscode.LanguageModelTool<Record<string, unknown>> {
  return {
    async invoke(
      options: vscode.LanguageModelToolInvocationOptions<Record<string, unknown>>,
      token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
      const result = await executor(options.input ?? {}, token);
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(formatter(result)),
      ]);
    },
    prepareInvocation(
      _options: vscode.LanguageModelToolInvocationPrepareOptions<Record<string, unknown>>,
      _token: vscode.CancellationToken
    ) {
      return {
        invocationMessage,
      };
    },
  };
}

/**
 * Create a LanguageModelTool wrapper for a no-params tool.
 * Includes prepareInvocation for proper VS Code Copilot tool invocation flow.
 * Uses a formatter to return human-readable text instead of raw JSON.
 */
function createSimpleTool<TResult>(
  executor: () => Promise<TResult>,
  invocationMessage: string,
  formatter: (result: TResult) => string
): vscode.LanguageModelTool<Record<string, unknown>> {
  return {
    async invoke(
      _options: vscode.LanguageModelToolInvocationOptions<Record<string, unknown>>,
      _token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
      const result = await executor();
      return new vscode.LanguageModelToolResult([
        new vscode.LanguageModelTextPart(formatter(result)),
      ]);
    },
    prepareInvocation(
      _options: vscode.LanguageModelToolInvocationPrepareOptions<Record<string, unknown>>,
      _token: vscode.CancellationToken
    ) {
      return {
        invocationMessage,
      };
    },
  };
}

export function activate(context: vscode.ExtensionContext): void {
  // Register all chat tools with invocation messages for Copilot tool flow
  context.subscriptions.push(
    vscode.lm.registerTool(
      'human_getUserInput',
      createTool(executeGetUserInput, 'Asking user for input…', formatUserInputResult)
    ),
    vscode.lm.registerTool(
      'human_getUserChoice',
      createTool(executeGetUserChoice, 'Presenting choices to user…', formatUserChoiceResult)
    ),
    vscode.lm.registerTool(
      'human_getMultilineInput',
      createTool(executeGetMultilineInput, 'Opening multi-line editor for user…', formatMultilineInputResult)
    ),
    vscode.lm.registerTool(
      'human_showConfirmation',
      createTool(
        executeShowConfirmation,
        'Asking user for confirmation…',
        formatConfirmationResult
      )
    ),
    vscode.lm.registerTool(
      'human_showInfoMessage',
      createTool(executeShowInfoMessage, 'Showing message to user…', formatInfoMessageResult)
    ),
    vscode.lm.registerTool(
      'human_healthCheck',
      createSimpleTool(executeHealthCheck, 'Checking extension health…', formatHealthCheckResult)
    )
  );

  // Register @human chat participant with /slash commands
  registerChatParticipant(context);
}

export function deactivate(): void {
  // Disposables are automatically cleaned up via context.subscriptions
}
