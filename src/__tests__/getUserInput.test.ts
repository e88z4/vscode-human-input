/**
 * Unit tests for getUserInput tool.
 */

import { executeGetUserInput, buildInputValidator } from '../tools/getUserInput';
import { showDialog } from '../webview';
import type { CancellationToken } from 'vscode';

// Mock platform module
jest.mock('../platform', () => ({
  getPlatformInfo: () => ({
    platform: 'linux',
    osName: 'Linux',
    isWindows: false,
    isMacOS: false,
    isLinux: true,
    isWSL: false,
    arch: 'x64',
    release: '5.15.0',
    hostname: 'test-host',
  }),
}));

// Mock the webview dialog
jest.mock('../webview', () => ({
  showDialog: jest.fn(),
}));

const mockShowDialog = showDialog as jest.MockedFunction<typeof showDialog>;

describe('buildInputValidator', () => {
  it('should return undefined for text type', () => {
    expect(buildInputValidator('text')).toBeUndefined();
  });

  it('should return validator for integer type', () => {
    const validator = buildInputValidator('integer');
    expect(validator).toBeDefined();
    expect(validator!('42')).toBeUndefined();
    expect(validator!('-5')).toBeUndefined();
    expect(validator!('abc')).toBe('Please enter a valid integer');
    expect(validator!('')).toBeUndefined();
  });

  it('should return validator for float type', () => {
    const validator = buildInputValidator('float');
    expect(validator).toBeDefined();
    expect(validator!('3.14')).toBeUndefined();
    expect(validator!('-2.5')).toBeUndefined();
    expect(validator!('abc')).toBe('Please enter a valid number');
    expect(validator!('')).toBeUndefined();
  });
});

describe('executeGetUserInput', () => {
  const mockToken: CancellationToken = {
    isCancellationRequested: false,
    onCancellationRequested: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockToken as { isCancellationRequested: boolean }).isCancellationRequested = false;
  });

  it('should return user input for text type', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: 'hello world' });

    const result = await executeGetUserInput(
      { title: 'Test', prompt: 'Enter text', inputType: 'text' },
      mockToken
    );

    expect(result.success).toBe(true);
    expect(result.user_input).toBe('hello world');
    expect(result.input_type).toBe('text');
    expect(result.cancelled).toBe(false);
    expect(result.platform).toBe('Linux');
  });

  it('should return parsed integer value', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: '42' });

    const result = await executeGetUserInput(
      { title: 'Test', prompt: 'Enter number', inputType: 'integer' },
      mockToken
    );

    expect(result.success).toBe(true);
    expect(result.user_input).toBe(42);
    expect(result.input_type).toBe('integer');
  });

  it('should return parsed float value', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: '3.14' });

    const result = await executeGetUserInput(
      { title: 'Test', prompt: 'Enter decimal', inputType: 'float' },
      mockToken
    );

    expect(result.success).toBe(true);
    expect(result.user_input).toBeCloseTo(3.14);
    expect(result.input_type).toBe('float');
  });

  it('should handle user cancellation', async () => {
    mockShowDialog.mockResolvedValue({ action: 'cancel' });

    const result = await executeGetUserInput(
      { title: 'Test', prompt: 'Enter text' },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.cancelled).toBe(true);
    expect(result.user_input).toBeNull();
  });

  it('should use default inputType when not provided', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: 'test' });

    const result = await executeGetUserInput(
      { title: 'Test', prompt: 'Enter text' },
      mockToken
    );

    expect(result.input_type).toBe('text');
  });

  it('should pass default value to dialog config', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: 'pre-filled' });

    await executeGetUserInput(
      { title: 'Test', prompt: 'Enter text', defaultValue: 'pre-filled' },
      mockToken
    );

    expect(mockShowDialog).toHaveBeenCalledWith(
      expect.objectContaining({ defaultValue: 'pre-filled', type: 'input' }),
      mockToken
    );
  });

  it('should return error for missing title', async () => {
    const result = await executeGetUserInput(
      { prompt: 'Enter text' },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameter: title');
  });

  it('should return error for missing prompt', async () => {
    const result = await executeGetUserInput(
      { title: 'Test' },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required parameter: prompt');
  });

  it('should return error for invalid integer input', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: 'not-a-number' });

    const result = await executeGetUserInput(
      { title: 'Test', prompt: 'Enter number', inputType: 'integer' },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid integer value');
  });

  it('should return error for invalid float input', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: 'not-a-number' });

    const result = await executeGetUserInput(
      { title: 'Test', prompt: 'Enter decimal', inputType: 'float' },
      mockToken
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid float value');
  });

  it('should pass correct dialog type and inputType', async () => {
    mockShowDialog.mockResolvedValue({ action: 'submit', value: '42' });

    await executeGetUserInput(
      { title: 'Test', prompt: 'Enter number', inputType: 'integer' },
      mockToken
    );

    expect(mockShowDialog).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'input', inputType: 'integer' }),
      mockToken
    );
  });
});
