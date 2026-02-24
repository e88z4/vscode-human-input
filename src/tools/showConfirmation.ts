/**
 * Show Confirmation Dialog tool implementation.
 * Opens a webview modal dialog with Yes/No buttons.
 */

import * as vscode from 'vscode';
import { getPlatformInfo } from '../platform';
import { validateRequiredString } from '../validation';
import { showDialog } from '../webview';
import type { ConfirmationResult } from '../types';

/**
 * Execute the show_confirmation_dialog tool.
 * Opens a centered webview dialog with a warning-styled message and Yes/No buttons.
 */
export async function executeShowConfirmation(
  params: Record<string, unknown>,
  _token: vscode.CancellationToken
): Promise<ConfirmationResult> {
  const platformInfo = getPlatformInfo();
  const platformName = platformInfo.osName;

  try {
    const title = validateRequiredString(params.title, 'title');
    const message = validateRequiredString(params.message, 'message');

    const result = await showDialog({
      type: 'confirmation',
      title,
      prompt: title,
      message,
    });

    if (result.action === 'cancel') {
      return {
        success: true,
        confirmed: false,
        response: 'no',
        cancelled: true,
        platform: platformName,
      };
    }

    const confirmed = result.value === 'yes';
    return {
      success: true,
      confirmed,
      response: confirmed ? 'yes' : 'no',
      cancelled: false,
      platform: platformName,
    };
  } catch (error) {
    return {
      success: false,
      confirmed: false,
      response: 'no',
      cancelled: false,
      platform: platformName,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
