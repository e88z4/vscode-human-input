/**
 * Health Check tool implementation.
 * Returns status information about the extension and platform.
 */

import * as os from 'os';
import { getPlatformInfo } from '../platform';
import type { HealthCheckResult } from '../types';

const EXTENSION_VERSION = '1.0.0';

const AVAILABLE_TOOLS = [
  'human_getUserInput',
  'human_getUserChoice',
  'human_getMultilineInput',
  'human_showConfirmation',
  'human_showInfoMessage',
  'human_healthCheck',
];

/**
 * Execute the health_check tool.
 */
export async function executeHealthCheck(): Promise<HealthCheckResult> {
  const platformInfo = getPlatformInfo();

  return {
    status: 'healthy',
    gui_available: true,
    server_name: 'Human-in-the-Loop VS Code Extension',
    platform: platformInfo.osName,
    platform_details: {
      system: os.platform(),
      release: os.release(),
      arch: os.arch(),
      hostname: os.hostname(),
      isWSL: platformInfo.isWSL,
    },
    extension_version: EXTENSION_VERSION,
    tools_available: AVAILABLE_TOOLS,
  };
}
