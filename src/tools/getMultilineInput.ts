/**
 * Get Multiline Input tool implementation.
 * Opens a webview modal dialog with a large text area for multi-line input.
 */

import * as vscode from 'vscode';
import { getPlatformInfo } from '../platform';
import { validateRequiredString, validateOptionalString } from '../validation';
import { showDialog } from '../webview';
import type { MultilineInputResult } from '../types';

/**
 * Execute the get_multiline_input tool.
 * Opens a centered webview dialog with a resizable text area.
 */
export async function executeGetMultilineInput(
  params: Record<string, unknown>,
  token: vscode.CancellationToken
): Promise<MultilineInputResult> {
  const platformInfo = getPlatformInfo();
  const platformName = platformInfo.osName;

  try {
    const title = validateRequiredString(params.title, 'title');
    const prompt = validateRequiredString(params.prompt, 'prompt');
    const defaultValue = validateOptionalString(params.defaultValue, 'defaultValue') ?? '';

    const result = await showDialog(
      {
        type: 'multiline',
        title,
        prompt,
        defaultValue,
      },
      token
    );

    if (result.action === 'cancel' || result.value === undefined) {
      return {
        success: false,
        user_input: null,
        character_count: 0,
        line_count: 0,
        cancelled: true,
        platform: platformName,
      };
    }

    const text = String(result.value);
    return {
      success: true,
      user_input: text,
      character_count: text.length,
      line_count: text.split('\n').length,
      cancelled: false,
      platform: platformName,
    };
  } catch (error) {
    return {
      success: false,
      user_input: null,
      character_count: 0,
      line_count: 0,
      cancelled: false,
      platform: platformName,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
