/**
 * Unit tests for showConfirmation tool.
 */

import { executeShowConfirmation } from '../tools/showConfirmation';
import { showDialog } from '../webview';
import type { CancellationToken } from 'vscode';

// Mock platform module
jest.mock('../platform', () => ({
  getPlatformInfo: () => ({
    platform: 'linux',
    osName: 'WSL (Windows Subsystem for Linux)',
    isWindows: false,
    isMacOS: false,
    isLinux: false,
    isWSL: true,
    arch: 'x64',
    release: '5.15.0-1-Microsoft-Standard-WSL2',
    hostname: 'DESKTOP-WSL',
  }),
}));

// Mock the webview dialog
jest.mock('../webview', () => ({
  showDialog: jest.fn(),
}));

const mockShowDialog = showDialog as jest.MockedFunction<typeof showDialog>;

describe('executeShowConfirmation', () => {
  const mockToken: CancellationToken = {
    isCancellationRequested: false,
    onCancellationRequested: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return confirmed=true when user clicks Yes', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: 'yes' });

    const result = await executeShowConfirmation(
      { title: 'Delete', message: 'Are you sure?' },
      mockToken
    );

    expect(result.success).toBe(true);
    expect(result.confirmed).toBe(true);
    expect(result.response).toBe('yes');
    expect(result.cancelled).toBe(false);
    expect(result.platform).toBe('WSL (Windows Subsystem for Linux)');
  });

  it('should return confirmed=false when user clicks No', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: 'no' });

    const result = await executeShowConfirmation(
      { title: 'Delete', message: 'Are you sure?' },
      mockToken
    );

    expect(result.success).toBe(true);
    expect(result.confirmed).toBe(false);
    expect(result.response).toBe('no');
    expect(result.cancelled).toBe(false);
  });

  it('should handle dismiss/cancel as not confirmed + cancelled', async () => {
    mockShowDialog.mockResolvedValue({ action: 'cancel' });

    const result = await executeShowConfirmation(
      { title: 'Delete', message: 'Are you sure?' },
      mockToken
    );

    expect(result.success).toBe(true);
    expect(result.confirmed).toBe(false);
    expect(result.response).toBe('no');
    expect(result.cancelled).toBe(true);
  });

  it('should pass correct dialog config', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: 'yes' });

    await executeShowConfirmation(
      { title: 'Title', message: 'Message' },
      mockToken
    );

    expect(mockShowDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'confirmation',
        title: 'Title',
        message: 'Message',
      })
    );
  });

  it('should return error for missing title', async () => {
    const result = await executeShowConfirmation(
      { message: 'Are you sure?' },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameter: title');
  });

  it('should return error for missing message', async () => {
    const result = await executeShowConfirmation(
      { title: 'Test' },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameter: message');
  });

  it('should handle errors gracefully', async () => {
    mockShowDialog.mockRejectedValue(new Error('Dialog failed'));

    const result = await executeShowConfirmation(
      { title: 'Test', message: 'Test message' },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.confirmed).toBe(false);
    expect(result.error).toBe('Dialog failed');
  });
});
