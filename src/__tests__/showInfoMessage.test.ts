/**
 * Unit tests for showInfoMessage tool.
 */

import { executeShowInfoMessage } from '../tools/showInfoMessage';
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

describe('executeShowInfoMessage', () => {
  const mockToken: CancellationToken = {
    isCancellationRequested: false,
    onCancellationRequested: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return acknowledged=true when user clicks OK', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: 'ok' });

    const result = await executeShowInfoMessage(
      { title: 'Success', message: 'Task completed!' },
      mockToken
    );

    expect(result.success).toBe(true);
    expect(result.acknowledged).toBe(true);
    expect(result.cancelled).toBe(false);
    expect(result.platform).toBe('macOS');
  });

  it('should return acknowledged=false when dismissed', async () => {
    mockShowDialog.mockResolvedValue({ action: 'cancel' });

    const result = await executeShowInfoMessage(
      { title: 'Info', message: 'Some info' },
      mockToken
    );

    expect(result.success).toBe(true);
    expect(result.acknowledged).toBe(false);
    expect(result.cancelled).toBe(true);
  });

  it('should pass correct dialog config', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: 'ok' });

    await executeShowInfoMessage(
      { title: 'Title', message: 'Message' },
      mockToken
    );

    expect(mockShowDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
        title: 'Title',
        message: 'Message',
      })
    );
  });

  it('should return error for missing title', async () => {
    const result = await executeShowInfoMessage(
      { message: 'Some info' },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameter: title');
  });

  it('should return error for missing message', async () => {
    const result = await executeShowInfoMessage(
      { title: 'Info' },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameter: message');
  });

  it('should handle errors gracefully', async () => {
    mockShowDialog.mockRejectedValue(new Error('Notification failed'));

    const result = await executeShowInfoMessage(
      { title: 'Test', message: 'Test message' },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.acknowledged).toBe(false);
    expect(result.error).toBe('Notification failed');
  });

  it('should return error for empty title', async () => {
    const result = await executeShowInfoMessage(
      { title: '', message: 'Some info' },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Parameter 'title' must not be empty");
  });

  it('should handle non-Error throw', async () => {
    mockShowDialog.mockRejectedValue('string error');

    const result = await executeShowInfoMessage(
      { title: 'Test', message: 'Test message' },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('string error');
  });
});
