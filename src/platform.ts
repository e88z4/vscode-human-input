/**
 * Platform detection utilities.
 * Provides cross-platform information for Windows, macOS, Linux, and WSL.
 */

import * as os from 'os';
import * as fs from 'fs';

export interface PlatformInfo {
  /** Raw platform string from os.platform() */
  platform: NodeJS.Platform;
  /** Human-readable OS name */
  osName: string;
  /** Whether running on Windows */
  isWindows: boolean;
  /** Whether running on macOS */
  isMacOS: boolean;
  /** Whether running on Linux */
  isLinux: boolean;
  /** Whether running inside WSL (Windows Subsystem for Linux) */
  isWSL: boolean;
  /** OS architecture */
  arch: string;
  /** OS release version */
  release: string;
  /** Hostname */
  hostname: string;
}

/**
 * Detect if the current environment is WSL.
 * Checks multiple indicators for reliable detection.
 */
export function detectWSL(): boolean {
  if (os.platform() !== 'linux') {
    return false;
  }

  // Check /proc/version for Microsoft/WSL indicators
  try {
    const procVersion = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
    if (procVersion.includes('microsoft') || procVersion.includes('wsl')) {
      return true;
    }
  } catch {
    // /proc/version not available
  }

  // Check WSL-specific environment variables
  if (process.env.WSL_DISTRO_NAME || process.env.WSLENV) {
    return true;
  }

  // Check for WSL interop
  try {
    if (fs.existsSync('/proc/sys/fs/binfmt_misc/WSLInterop')) {
      return true;
    }
  } catch {
    // Not available
  }

  return false;
}

/**
 * Get a human-readable OS name.
 */
export function getOSName(platform: NodeJS.Platform, isWSL: boolean): string {
  if (isWSL) {
    return 'WSL (Windows Subsystem for Linux)';
  }
  switch (platform) {
    case 'win32':
      return 'Windows';
    case 'darwin':
      return 'macOS';
    case 'linux':
      return 'Linux';
    default:
      return platform;
  }
}

/**
 * Get comprehensive platform information.
 */
export function getPlatformInfo(): PlatformInfo {
  const platform = os.platform();
  const isWSL = detectWSL();

  return {
    platform,
    osName: getOSName(platform, isWSL),
    isWindows: platform === 'win32',
    isMacOS: platform === 'darwin',
    isLinux: platform === 'linux' && !isWSL,
    isWSL,
    arch: os.arch(),
    release: os.release(),
    hostname: os.hostname(),
  };
}
