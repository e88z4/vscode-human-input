/**
 * Webview Dialog Manager.
 * Creates centered webview panels styled as modal dialogs.
 * Provides a unified UI for all human-in-the-loop tool interactions.
 */

import * as vscode from 'vscode';
import { getDialogHtml, DialogConfig } from './getHtml';

export type { DialogConfig } from './getHtml';

/**
 * Result from a webview dialog interaction.
 */
export interface DialogResult {
  /** 'submit' if user submitted, 'cancel' if user dismissed */
  action: 'submit' | 'cancel';
  /** The submitted value (type depends on dialog type) */
  value?: string | string[] | boolean;
}

/**
 * Show a webview modal dialog and wait for user response.
 *
 * Opens a centered webview panel styled as a modal dialog.
 * Returns a promise that resolves when the user submits or cancels.
 *
 * @param config - Dialog configuration
 * @param token - Cancellation token (optional)
 * @returns Dialog result with action and value
 */
export async function showDialog(
  config: DialogConfig,
  token?: vscode.CancellationToken
): Promise<DialogResult> {
  const panel = vscode.window.createWebviewPanel(
    'humanInTheLoop',
    `Human Input: ${config.title}`,
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      retainContextWhenHidden: false,
    }
  );

  panel.webview.html = getDialogHtml(config);

  return new Promise<DialogResult>((resolve) => {
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
      }
    };

    // Listen for messages from the webview
    const messageDisposable = panel.webview.onDidReceiveMessage(
      (message: DialogResult) => {
        cleanup();
        resolve(message);
        panel.dispose();
      }
    );

    // Handle panel being closed (user clicks X)
    panel.onDidDispose(() => {
      messageDisposable.dispose();
      if (!resolved) {
        cleanup();
        resolve({ action: 'cancel' });
      }
    });

    // Handle cancellation token
    if (token) {
      const tokenDisposable = token.onCancellationRequested(() => {
        if (!resolved) {
          cleanup();
          resolve({ action: 'cancel' });
          panel.dispose();
        }
        tokenDisposable.dispose();
      });
    }
  });
}
