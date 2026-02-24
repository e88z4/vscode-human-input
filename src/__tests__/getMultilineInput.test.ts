/**
 * Unit tests for getMultilineInput tool.
 */

import { executeGetMultilineInput } from '../tools/getMultilineInput';
import { showDialog } from '../webview';
import type { CancellationToken } from 'vscode';

// Mock platform module
jest.mock('../platform', () => ({
  getPlatformInfo: () => ({
    platform: 'darwin',
    osName: 'macOS',
    isWindows: false,
    isMacOS: true,
    isLinux: false,
    isWSL: false,
    arch: 'arm64',
    release: '23.0.0',
    hostname: 'MacBook.local',
  }),
}));

// Mock the webview dialog
jest.mock('../webview', () => ({
  showDialog: jest.fn(),
}));

const mockShowDialog = showDialog as jest.MockedFunction<typeof showDialog>;

describe('executeGetMultilineInput', () => {
  const mockToken: CancellationToken = {
    isCancellationRequested: false,
    onCancellationRequested: jest.fn(() => ({ dispose: jest.fn() })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockToken as { isCancellationRequested: boolean }).isCancellationRequested = false;
  });

  it('should return multiline text on submit', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: 'Hello\nWorld' });

    const result = await executeGetMultilineInput(
      { title: 'Test Title', prompt: 'Test Prompt' },
      mockToken
    );

    expect(result.success).toBe(true);
    expect(result.user_input).toBe('Hello\nWorld');
    expect(result.character_count).toBe(11);
    expect(result.line_count).toBe(2);
    expect(result.cancelled).toBe(false);
    expect(result.platform).toBe('macOS');
  });

  it('should handle user cancellation', async () => {
    mockShowDialog.mockResolvedValue({ action: 'cancel' });

    const result = await executeGetMultilineInput(
      { title: 'Test', prompt: 'Enter text' },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.cancelled).toBe(true);
    expect(result.user_input).toBeNull();
  });

  it('should handle cancel with undefined value', async () => {
    mockShowDialog.mockResolvedValue({ action: 'cancel', value: undefined });

    const result = await executeGetMultilineInput(
      { title: 'Test', prompt: 'Enter text' },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.cancelled).toBe(true);
  });

  it('should pass default value to dialog', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: 'Pre-filled content' });

    const result = await executeGetMultilineInput(
      { title: 'Title', prompt: 'Prompt', defaultValue: 'Pre-filled content' },
      mockToken
    );

    expect(result.success).toBe(true);
    expect(result.user_input).toBe('Pre-filled content');

    expect(mockShowDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'multiline',
        defaultValue: 'Pre-filled content',
      }),
      mockToken
    );
  });

  it('should pass correct dialog config', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: 'text' });

    await executeGetMultilineInput(
      { title: 'Test', prompt: 'Enter text' },
      mockToken
    );

    expect(mockShowDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'multiline',
        title: 'Test',
        prompt: 'Enter text',
      }),
      mockToken
    );
  });

  it('should return error for missing title', async () => {
    const result = await executeGetMultilineInput(
      { prompt: 'Enter text' },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameter: title');
  });

  it('should return error for missing prompt', async () => {
    const result = await executeGetMultilineInput(
      { title: 'Test' },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameter: prompt');
  });

  it('should handle empty submitted text', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: '' });

    const result = await executeGetMultilineInput(
      { title: 'Title', prompt: 'Prompt' },
      mockToken
    );

    expect(result.success).toBe(true);
    expect(result.user_input).toBe('');
    expect(result.character_count).toBe(0);
  });

  it('should count lines correctly for multi-line text', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: 'Line1\nLine2\nLine3' });

    const result = await executeGetMultilineInput(
      { title: 'Test', prompt: 'Enter text' },
      mockToken
    );

    expect(result.success).toBe(true);
    expect(result.line_count).toBe(3);
  });
});
