/**
 * Unit tests for getUserChoice tool.
 */

import { executeGetUserChoice } from '../tools/getUserChoice';
import { showDialog } from '../webview';
import type { CancellationToken } from 'vscode';

// Mock platform module
jest.mock('../platform', () => ({
  getPlatformInfo: () => ({
    platform: 'win32',
    osName: 'Windows',
    isWindows: true,
    isMacOS: false,
    isLinux: false,
    isWSL: false,
    arch: 'x64',
    release: '10.0.22000',
    hostname: 'DESKTOP-TEST',
  }),
}));

// Mock the webview dialog
jest.mock('../webview', () => ({
  showDialog: jest.fn(),
}));

const mockShowDialog = showDialog as jest.MockedFunction<typeof showDialog>;

describe('executeGetUserChoice', () => {
  const mockToken: CancellationToken = {
    isCancellationRequested: false,
    onCancellationRequested: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockToken as { isCancellationRequested: boolean }).isCancellationRequested = false;
  });

  it('should return single selected choice', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: 'React' });

    const result = await executeGetUserChoice(
      {
        title: 'Framework',
        prompt: 'Choose framework',
        choices: ['React', 'Vue', 'Angular'],
      },
      mockToken
    );

    expect(result.success).toBe(true);
    expect(result.selected_choice).toBe('React');
    expect(result.selected_choices).toEqual(['React']);
    expect(result.allow_multiple).toBe(false);
    expect(result.cancelled).toBe(false);
    expect(result.platform).toBe('Windows');
  });

  it('should return multiple selected choices', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: ['React', 'Vue'] });

    const result = await executeGetUserChoice(
      {
        title: 'Frameworks',
        prompt: 'Choose frameworks',
        choices: ['React', 'Vue', 'Angular'],
        allowMultiple: true,
      },
      mockToken
    );

    expect(result.success).toBe(true);
    expect(result.selected_choice).toBe('React');
    expect(result.selected_choices).toEqual(['React', 'Vue']);
    expect(result.allow_multiple).toBe(true);
  });

  it('should handle single-select cancellation', async () => {
    mockShowDialog.mockResolvedValue({ action: 'cancel' });

    const result = await executeGetUserChoice(
      {
        title: 'Test',
        prompt: 'Choose',
        choices: ['A', 'B'],
      },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.cancelled).toBe(true);
    expect(result.selected_choice).toBeNull();
    expect(result.selected_choices).toEqual([]);
  });

  it('should handle multi-select cancellation', async () => {
    mockShowDialog.mockResolvedValue({ action: 'cancel' });

    const result = await executeGetUserChoice(
      {
        title: 'Test',
        prompt: 'Choose',
        choices: ['A', 'B'],
        allowMultiple: true,
      },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.cancelled).toBe(true);
  });

  it('should pass correct dialog config for single select', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: 'A' });

    await executeGetUserChoice(
      {
        title: 'Test',
        prompt: 'Choose',
        choices: ['A', 'B'],
      },
      mockToken
    );

    expect(mockShowDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'choice',
        title: 'Test',
        prompt: 'Choose',
        choices: ['A', 'B'],
        allowMultiple: false,
      }),
      mockToken
    );
  });

  it('should pass correct dialog config for multi select', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: ['A'] });

    await executeGetUserChoice(
      {
        title: 'Test',
        prompt: 'Choose',
        choices: ['A', 'B'],
        allowMultiple: true,
      },
      mockToken
    );

    expect(mockShowDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'choice',
        allowMultiple: true,
      }),
      mockToken
    );
  });

  it('should return error for missing required params', async () => {
    const result = await executeGetUserChoice(
      { title: 'Test', prompt: 'Choose' },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Parameter 'choices' must be an array");
  });

  it('should return error for empty choices', async () => {
    const result = await executeGetUserChoice(
      { title: 'Test', prompt: 'Choose', choices: [] },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Parameter 'choices' must not be empty");
  });

  it('should return error for missing title', async () => {
    const result = await executeGetUserChoice(
      { prompt: 'Choose', choices: ['A'] },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameter: title');
  });

  it('should handle cancel value as undefined', async () => {
    mockShowDialog.mockResolvedValue({ action: 'cancel', value: undefined });

    const result = await executeGetUserChoice(
      {
        title: 'Test',
        prompt: 'Choose',
        choices: ['A', 'B'],
      },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.cancelled).toBe(true);
  });
});
