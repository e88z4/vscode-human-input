/**
 * Unit tests for WebviewDialogManager.
 */

import * as vscode from 'vscode';
import { showDialog } from '../webview/WebviewDialogManager';

describe('showDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Helper: get the most recently created mock panel and its test helpers.
   */
  function getLastPanel() {
    const calls = (vscode.window.createWebviewPanel as jest.Mock).mock.results;
    return calls[calls.length - 1].value;
  }

  it('should create a webview panel with correct options', async () => {
    const promise = showDialog({
      type: 'input',
      title: 'Test Title',
      prompt: 'Enter something',
    });

    const panel = getLastPanel();
    // Simulate user submitting
    panel._simulateMessage({ action: 'submit', value: 'hello' });

    await promise;

    expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
      'humanInTheLoop',
      'Human Input: Test Title',
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: false,
      }
    );
  });

  it('should set HTML content on the webview', async () => {
    const promise = showDialog({
      type: 'input',
      title: 'Test',
      prompt: 'Enter',
    });

    const panel = getLastPanel();
    expect(panel.webview.html).toContain('<!DOCTYPE html>');
    expect(panel.webview.html).toContain('Test');
    expect(panel.webview.html).toContain('Enter');

    panel._simulateMessage({ action: 'submit', value: 'val' });
    await promise;
  });

  it('should resolve with submitted value on user message', async () => {
    const promise = showDialog({
      type: 'input',
      title: 'Test',
      prompt: 'Enter',
    });

    const panel = getLastPanel();
    panel._simulateMessage({ action: 'submit', value: 'test answer' });

    const result = await promise;
    expect(result).toEqual({ action: 'submit', value: 'test answer' });
  });

  it('should resolve with cancel when user sends cancel', async () => {
    const promise = showDialog({
      type: 'input',
      title: 'Test',
      prompt: 'Enter',
    });

    const panel = getLastPanel();
    panel._simulateMessage({ action: 'cancel' });

    const result = await promise;
    expect(result).toEqual({ action: 'cancel' });
  });

  it('should resolve with cancel when panel is disposed (user clicks X)', async () => {
    const promise = showDialog({
      type: 'input',
      title: 'Test',
      prompt: 'Enter',
    });

    const panel = getLastPanel();
    panel._simulateDispose();

    const result = await promise;
    expect(result).toEqual({ action: 'cancel' });
  });

  it('should dispose panel after message is received', async () => {
    const promise = showDialog({
      type: 'input',
      title: 'Test',
      prompt: 'Enter',
    });

    const panel = getLastPanel();
    panel._simulateMessage({ action: 'submit', value: 'x' });

    await promise;
    expect(panel.dispose).toHaveBeenCalled();
  });

  it('should handle cancellation token', async () => {
    let cancelCallback: (() => void) | undefined;
    const mockToken = {
      isCancellationRequested: false,
      onCancellationRequested: jest.fn((callback: () => void) => {
        cancelCallback = callback;
        return { dispose: jest.fn() };
      }),
    } as unknown as vscode.CancellationToken;

    const promise = showDialog(
      { type: 'input', title: 'Test', prompt: 'Enter' },
      mockToken
    );

    // Trigger cancellation
    cancelCallback!();

    const result = await promise;
    expect(result).toEqual({ action: 'cancel' });
  });

  it('should not resolve twice if panel disposed after message', async () => {
    const promise = showDialog({
      type: 'input',
      title: 'Test',
      prompt: 'Enter',
    });

    const panel = getLastPanel();
    // First: user submits
    panel._simulateMessage({ action: 'submit', value: 'hello' });
    // Then: panel dispose fires
    panel._simulateDispose();

    const result = await promise;
    // Should resolve with the submit, not cancel
    expect(result).toEqual({ action: 'submit', value: 'hello' });
  });

  it('should work with choice dialog type', async () => {
    const promise = showDialog({
      type: 'choice',
      title: 'Pick',
      prompt: 'Choose one',
      choices: ['A', 'B', 'C'],
    });

    const panel = getLastPanel();
    expect(panel.webview.html).toContain('A');
    expect(panel.webview.html).toContain('B');

    panel._simulateMessage({ action: 'submit', value: 'B' });

    const result = await promise;
    expect(result).toEqual({ action: 'submit', value: 'B' });
  });

  it('should work with confirmation dialog type', async () => {
    const promise = showDialog({
      type: 'confirmation',
      title: 'Confirm',
      prompt: 'Sure?',
      message: 'This is permanent',
    });

    const panel = getLastPanel();
    expect(panel.webview.html).toContain('This is permanent');

    panel._simulateMessage({ action: 'submit', value: 'yes' });

    const result = await promise;
    expect(result).toEqual({ action: 'submit', value: 'yes' });
  });

  it('should work with multiline dialog type', async () => {
    const promise = showDialog({
      type: 'multiline',
      title: 'Multi',
      prompt: 'Enter text',
      defaultValue: 'default text',
    });

    const panel = getLastPanel();
    expect(panel.webview.html).toContain('default text');

    panel._simulateMessage({ action: 'submit', value: 'line1\nline2' });

    const result = await promise;
    expect(result).toEqual({ action: 'submit', value: 'line1\nline2' });
  });

  it('should work with info dialog type', async () => {
    const promise = showDialog({
      type: 'info',
      title: 'Info',
      prompt: 'Note',
      message: 'All done!',
    });

    const panel = getLastPanel();
    expect(panel.webview.html).toContain('All done!');

    panel._simulateMessage({ action: 'submit', value: 'ok' });

    const result = await promise;
    expect(result).toEqual({ action: 'submit', value: 'ok' });
  });
});
