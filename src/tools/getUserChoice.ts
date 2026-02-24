/**
 * Get User Choice tool implementation.
 * Opens a webview modal dialog for the user to select from multiple options.
 */

import * as vscode from 'vscode';
import { getPlatformInfo } from '../platform';
import {
  validateRequiredString,
  validateChoices,
  validateBoolean,
} from '../validation';
import { showDialog } from '../webview';
import type { UserChoiceResult } from '../types';

/**
 * Execute the get_user_choice tool.
 * Opens a centered webview dialog with clickable choices.
 */
export async function executeGetUserChoice(
  params: Record<string, unknown>,
  token: vscode.CancellationToken
): Promise<UserChoiceResult> {
  const platformInfo = getPlatformInfo();
  const platformName = platformInfo.osName;

  try {
    const title = validateRequiredString(params.title, 'title');
    const prompt = validateRequiredString(params.prompt, 'prompt');
    const choices = validateChoices(params.choices);
    const allowMultiple = validateBoolean(params.allowMultiple, false);

    const result = await showDialog(
      {
        type: 'choice',
        title,
        prompt,
        choices,
        allowMultiple,
      },
      token
    );

    if (result.action === 'cancel' || result.value === undefined) {
      return {
        success: false,
        selected_choice: null,
        selected_choices: [],
        allow_multiple: allowMultiple,
        cancelled: true,
        platform: platformName,
      };
    }

    if (allowMultiple && Array.isArray(result.value)) {
      const selectedLabels = result.value as string[];
      return {
        success: true,
        selected_choice: selectedLabels.length > 0 ? selectedLabels[0] : null,
        selected_choices: selectedLabels,
        allow_multiple: allowMultiple,
        cancelled: false,
        platform: platformName,
      };
    } else {
      const selectedLabel = String(result.value);
      return {
        success: true,
        selected_choice: selectedLabel,
        selected_choices: [selectedLabel],
        allow_multiple: allowMultiple,
        cancelled: false,
        platform: platformName,
      };
    }
  } catch (error) {
    return {
      success: false,
      selected_choice: null,
      selected_choices: [],
      allow_multiple: false,
      cancelled: false,
      platform: platformName,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
