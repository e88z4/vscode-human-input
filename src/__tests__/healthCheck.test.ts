/**
 * Unit tests for healthCheck tool.
 */

import * as os from 'os';
import { executeHealthCheck } from '../tools/healthCheck';

// Mock os module
jest.mock('os');

const mockedOs = os as jest.Mocked<typeof os>;

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

describe('executeHealthCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedOs.platform.mockReturnValue('win32');
    mockedOs.release.mockReturnValue('10.0.22000');
    mockedOs.arch.mockReturnValue('x64');
    mockedOs.hostname.mockReturnValue('DESKTOP-TEST');
  });

  it('should return healthy status', async () => {
    const result = await executeHealthCheck();

    expect(result.status).toBe('healthy');
    expect(result.gui_available).toBe(true);
    expect(result.server_name).toBe('Human-in-the-Loop VS Code Extension');
  });

  it('should return correct platform info', async () => {
    const result = await executeHealthCheck();

    expect(result.platform).toBe('Windows');
    expect(result.platform_details.system).toBe('win32');
    expect(result.platform_details.release).toBe('10.0.22000');
    expect(result.platform_details.arch).toBe('x64');
    expect(result.platform_details.hostname).toBe('DESKTOP-TEST');
    expect(result.platform_details.isWSL).toBe(false);
  });

  it('should return extension version', async () => {
    const result = await executeHealthCheck();

    expect(result.extension_version).toBe('1.0.0');
  });

  it('should list all available tools', async () => {
    const result = await executeHealthCheck();

    expect(result.tools_available).toEqual([
      'human_getUserInput',
      'human_getUserChoice',
      'human_getMultilineInput',
      'human_showConfirmation',
      'human_showInfoMessage',
      'human_healthCheck',
    ]);
  });

  it('should have all expected fields', async () => {
    const result = await executeHealthCheck();

    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('gui_available');
    expect(result).toHaveProperty('server_name');
    expect(result).toHaveProperty('platform');
    expect(result).toHaveProperty('platform_details');
    expect(result).toHaveProperty('extension_version');
    expect(result).toHaveProperty('tools_available');
  });
});
