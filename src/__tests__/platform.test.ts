/**
 * Unit tests for platform detection utilities.
 */

import * as os from 'os';
import * as fs from 'fs';
import { detectWSL, getOSName, getPlatformInfo } from '../platform';

// Mock os and fs modules
jest.mock('os');
jest.mock('fs');

const mockedOs = os as jest.Mocked<typeof os>;
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('detectWSL', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return false on non-linux platforms', () => {
    mockedOs.platform.mockReturnValue('win32');
    expect(detectWSL()).toBe(false);
  });

  it('should return false on macOS', () => {
    mockedOs.platform.mockReturnValue('darwin');
    expect(detectWSL()).toBe(false);
  });

  it('should detect WSL via /proc/version containing microsoft', () => {
    mockedOs.platform.mockReturnValue('linux');
    mockedFs.readFileSync.mockReturnValue(
      'Linux version 5.15.0-1-Microsoft-Standard-WSL2'
    );
    mockedFs.existsSync.mockReturnValue(false);
    expect(detectWSL()).toBe(true);
  });

  it('should detect WSL via /proc/version containing wsl', () => {
    mockedOs.platform.mockReturnValue('linux');
    mockedFs.readFileSync.mockReturnValue(
      'Linux version 5.15.0-1-wsl2'
    );
    mockedFs.existsSync.mockReturnValue(false);
    expect(detectWSL()).toBe(true);
  });

  it('should detect WSL via WSL_DISTRO_NAME env var', () => {
    mockedOs.platform.mockReturnValue('linux');
    mockedFs.readFileSync.mockReturnValue('Linux version 5.15.0-generic');
    process.env.WSL_DISTRO_NAME = 'Ubuntu';
    mockedFs.existsSync.mockReturnValue(false);
    expect(detectWSL()).toBe(true);
  });

  it('should detect WSL via WSLENV env var', () => {
    mockedOs.platform.mockReturnValue('linux');
    mockedFs.readFileSync.mockReturnValue('Linux version 5.15.0-generic');
    process.env.WSLENV = 'USERPROFILE/up';
    mockedFs.existsSync.mockReturnValue(false);
    expect(detectWSL()).toBe(true);
  });

  it('should detect WSL via WSLInterop file', () => {
    mockedOs.platform.mockReturnValue('linux');
    mockedFs.readFileSync.mockReturnValue('Linux version 5.15.0-generic');
    delete process.env.WSL_DISTRO_NAME;
    delete process.env.WSLENV;
    mockedFs.existsSync.mockReturnValue(true);
    expect(detectWSL()).toBe(true);
  });

  it('should return false on native Linux', () => {
    mockedOs.platform.mockReturnValue('linux');
    mockedFs.readFileSync.mockReturnValue('Linux version 5.15.0-generic #1 SMP');
    delete process.env.WSL_DISTRO_NAME;
    delete process.env.WSLENV;
    mockedFs.existsSync.mockReturnValue(false);
    expect(detectWSL()).toBe(false);
  });

  it('should handle /proc/version read error gracefully', () => {
    mockedOs.platform.mockReturnValue('linux');
    mockedFs.readFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    delete process.env.WSL_DISTRO_NAME;
    delete process.env.WSLENV;
    mockedFs.existsSync.mockReturnValue(false);
    expect(detectWSL()).toBe(false);
  });

  it('should handle existsSync error gracefully', () => {
    mockedOs.platform.mockReturnValue('linux');
    mockedFs.readFileSync.mockReturnValue('Linux version 5.15.0-generic');
    delete process.env.WSL_DISTRO_NAME;
    delete process.env.WSLENV;
    mockedFs.existsSync.mockImplementation(() => {
      throw new Error('Permission denied');
    });
    expect(detectWSL()).toBe(false);
  });
});

describe('getOSName', () => {
  it('should return "Windows" for win32', () => {
    expect(getOSName('win32', false)).toBe('Windows');
  });

  it('should return "macOS" for darwin', () => {
    expect(getOSName('darwin', false)).toBe('macOS');
  });

  it('should return "Linux" for linux without WSL', () => {
    expect(getOSName('linux', false)).toBe('Linux');
  });

  it('should return WSL name when isWSL is true', () => {
    expect(getOSName('linux', true)).toBe('WSL (Windows Subsystem for Linux)');
  });

  it('should return platform string for unknown platforms', () => {
    expect(getOSName('freebsd' as NodeJS.Platform, false)).toBe('freebsd');
  });
});

describe('getPlatformInfo', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return complete platform info for Windows', () => {
    mockedOs.platform.mockReturnValue('win32');
    mockedOs.arch.mockReturnValue('x64');
    mockedOs.release.mockReturnValue('10.0.22000');
    mockedOs.hostname.mockReturnValue('DESKTOP-TEST');

    const info = getPlatformInfo();

    expect(info.platform).toBe('win32');
    expect(info.osName).toBe('Windows');
    expect(info.isWindows).toBe(true);
    expect(info.isMacOS).toBe(false);
    expect(info.isLinux).toBe(false);
    expect(info.isWSL).toBe(false);
    expect(info.arch).toBe('x64');
    expect(info.release).toBe('10.0.22000');
    expect(info.hostname).toBe('DESKTOP-TEST');
  });

  it('should return complete platform info for macOS', () => {
    mockedOs.platform.mockReturnValue('darwin');
    mockedOs.arch.mockReturnValue('arm64');
    mockedOs.release.mockReturnValue('23.0.0');
    mockedOs.hostname.mockReturnValue('MacBook.local');

    const info = getPlatformInfo();

    expect(info.platform).toBe('darwin');
    expect(info.osName).toBe('macOS');
    expect(info.isWindows).toBe(false);
    expect(info.isMacOS).toBe(true);
    expect(info.isLinux).toBe(false);
    expect(info.isWSL).toBe(false);
  });

  it('should return complete platform info for native Linux', () => {
    mockedOs.platform.mockReturnValue('linux');
    mockedOs.arch.mockReturnValue('x64');
    mockedOs.release.mockReturnValue('5.15.0-generic');
    mockedOs.hostname.mockReturnValue('ubuntu-desktop');
    mockedFs.readFileSync.mockReturnValue('Linux version 5.15.0-generic');
    delete process.env.WSL_DISTRO_NAME;
    delete process.env.WSLENV;
    mockedFs.existsSync.mockReturnValue(false);

    const info = getPlatformInfo();

    expect(info.platform).toBe('linux');
    expect(info.osName).toBe('Linux');
    expect(info.isLinux).toBe(true);
    expect(info.isWSL).toBe(false);
  });

  it('should detect WSL correctly', () => {
    mockedOs.platform.mockReturnValue('linux');
    mockedOs.arch.mockReturnValue('x64');
    mockedOs.release.mockReturnValue('5.15.0-1-Microsoft-Standard-WSL2');
    mockedOs.hostname.mockReturnValue('DESKTOP-WSL');
    mockedFs.readFileSync.mockReturnValue(
      'Linux version 5.15.0-1-Microsoft-Standard-WSL2'
    );

    const info = getPlatformInfo();

    expect(info.platform).toBe('linux');
    expect(info.osName).toBe('WSL (Windows Subsystem for Linux)');
    expect(info.isWSL).toBe(true);
    expect(info.isLinux).toBe(false); // isLinux should be false for WSL
  });
});
