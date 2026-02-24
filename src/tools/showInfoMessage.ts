/**
 * Show Info Message tool implementation.
 * Opens a webview modal dialog displaying an informational message.
 */

import * as vscode from 'vscode';
import { getPlatformInfo } from '../platform';
import { validateRequiredString } from '../validation';
import { showDialog } from '../webview';
import type { InfoMessageResult } from '../types';

/**
 * Execute the show_info_message tool.
 * Opens a centered webview dialog with the info message and an OK button.
 */
export async function executeShowInfoMessage(
  params: Record<string, unknown>,
  _token: vscode.CancellationToken
): Promise<InfoMessageResult> {
  const platformInfo = getPlatformInfo();
  const platformName = platformInfo.osName;

  try {
    const title = validateRequiredString(params.title, 'title');
    const message = validateRequiredString(params.message, 'message');

    const result = await showDialog({
      type: 'info',
      title,
      prompt: title,
      message,
    });

    return {
      success: true,
      acknowledged: result.action === 'submit',
      cancelled: result.action === 'cancel',
      platform: platformName,
    };
  } catch (error) {
    return {
      success: false,
      acknowledged: false,
      cancelled: false,
      platform: platformName,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
