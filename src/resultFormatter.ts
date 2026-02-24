/**
 * Result formatter for tool outputs.
 *
 * Converts raw tool result objects into clear, human-readable text
 * that the LLM can easily relay to the user. This prevents the LLM
 * from dumping raw JSON into the chat response.
 */

import type {
  UserInputResult,
  UserChoiceResult,
  MultilineInputResult,
  ConfirmationResult,
  InfoMessageResult,
  HealthCheckResult,
} from './types';

/**
 * Format the getUserInput result into readable text.
 */
export function formatUserInputResult(result: UserInputResult): string {
  if (result.error) {
    return `**Error:** ${result.error}`;
  }
  if (result.cancelled) {
    return '**Result:** The user cancelled the input dialog without providing a response.';
  }
  const value = result.user_input;
  const typeLabel = result.input_type !== 'text' ? ` (${result.input_type})` : '';
  return [
    `**Result:** The user provided the following input${typeLabel}:`,
    '',
    `> ${String(value)}`,
  ].join('\n');
}

/**
 * Format the getUserChoice result into readable text.
 */
export function formatUserChoiceResult(result: UserChoiceResult): string {
  if (result.error) {
    return `**Error:** ${result.error}`;
  }
  if (result.cancelled) {
    return '**Result:** The user cancelled the selection without choosing.';
  }

  if (result.allow_multiple && result.selected_choices.length > 0) {
    const items = result.selected_choices.map((c) => `- ${c}`).join('\n');
    return [
      `**Result:** The user selected ${result.selected_choices.length} option(s):`,
      '',
      items,
    ].join('\n');
  }

  return `**Result:** The user selected: **${result.selected_choice}**`;
}

/**
 * Format the getMultilineInput result into readable text.
 */
export function formatMultilineInputResult(result: MultilineInputResult): string {
  if (result.error) {
    return `**Error:** ${result.error}`;
  }
  if (result.cancelled) {
    return '**Result:** The user cancelled the multi-line input without submitting.';
  }

  const text = result.user_input ?? '';
  return [
    `**Result:** The user provided the following text (${result.character_count} chars, ${result.line_count} line(s)):`,
    '',
    '```',
    text,
    '```',
  ].join('\n');
}

/**
 * Format the showConfirmation result into readable text.
 */
export function formatConfirmationResult(result: ConfirmationResult): string {
  if (result.error) {
    return `**Error:** ${result.error}`;
  }
  if (result.cancelled) {
    return '**Result:** The user dismissed the confirmation dialog without responding.';
  }
  return result.confirmed
    ? '**Result:** The user confirmed: **Yes**'
    : '**Result:** The user declined: **No**';
}

/**
 * Format the showInfoMessage result into readable text.
 */
export function formatInfoMessageResult(result: InfoMessageResult): string {
  if (result.error) {
    return `**Error:** ${result.error}`;
  }
  if (result.cancelled) {
    return '**Result:** The user dismissed the information message.';
  }
  return result.acknowledged
    ? '**Result:** The user acknowledged the message.'
    : '**Result:** The user dismissed the information message.';
}

/**
 * Format the healthCheck result into readable text.
 */
export function formatHealthCheckResult(result: HealthCheckResult): string {
  return [
    `**Status:** ${result.status}`,
    `**Platform:** ${result.platform} (${result.platform_details.arch})`,
    `**WSL:** ${result.platform_details.isWSL ? 'Yes' : 'No'}`,
    `**Version:** ${result.extension_version}`,
    `**Available tools:** ${result.tools_available.join(', ')}`,
  ].join('\n');
}
