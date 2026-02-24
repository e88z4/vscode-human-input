/**
 * Tests for resultFormatter — verifies human-readable formatting of tool results.
 */

import {
  formatUserInputResult,
  formatUserChoiceResult,
  formatMultilineInputResult,
  formatConfirmationResult,
  formatInfoMessageResult,
  formatHealthCheckResult,
} from '../resultFormatter';
import type {
  UserInputResult,
  UserChoiceResult,
  MultilineInputResult,
  ConfirmationResult,
  InfoMessageResult,
  HealthCheckResult,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function baseResult(overrides: Partial<{ success: boolean; cancelled: boolean; platform: string; error?: string }> = {}) {
  return {
    success: true,
    cancelled: false,
    platform: 'linux',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// formatUserInputResult
// ---------------------------------------------------------------------------

describe('formatUserInputResult', () => {
  it('formats a successful text input', () => {
    const result: UserInputResult = {
      ...baseResult(),
      user_input: 'hello world',
      input_type: 'text',
    };
    const out = formatUserInputResult(result);
    expect(out).toContain('**Result:**');
    expect(out).toContain('> hello world');
    expect(out).not.toContain('(text)'); // text type is omitted
  });

  it('formats a successful integer input', () => {
    const result: UserInputResult = {
      ...baseResult(),
      user_input: 42,
      input_type: 'integer',
    };
    const out = formatUserInputResult(result);
    expect(out).toContain('(integer)');
    expect(out).toContain('> 42');
  });

  it('formats a successful float input', () => {
    const result: UserInputResult = {
      ...baseResult(),
      user_input: 3.14,
      input_type: 'float',
    };
    const out = formatUserInputResult(result);
    expect(out).toContain('(float)');
    expect(out).toContain('> 3.14');
  });

  it('formats a cancelled input', () => {
    const result: UserInputResult = {
      ...baseResult({ success: false, cancelled: true }),
      user_input: null,
      input_type: 'text',
    };
    const out = formatUserInputResult(result);
    expect(out).toContain('cancelled');
  });

  it('formats an error', () => {
    const result: UserInputResult = {
      ...baseResult({ success: false, error: 'Something went wrong' }),
      user_input: null,
      input_type: 'text',
    };
    const out = formatUserInputResult(result);
    expect(out).toContain('**Error:**');
    expect(out).toContain('Something went wrong');
  });
});

// ---------------------------------------------------------------------------
// formatUserChoiceResult
// ---------------------------------------------------------------------------

describe('formatUserChoiceResult', () => {
  it('formats a single selection', () => {
    const result: UserChoiceResult = {
      ...baseResult(),
      selected_choice: 'Option B',
      selected_choices: [],
      allow_multiple: false,
    };
    const out = formatUserChoiceResult(result);
    expect(out).toContain('**Option B**');
  });

  it('formats multiple selections', () => {
    const result: UserChoiceResult = {
      ...baseResult(),
      selected_choice: null,
      selected_choices: ['Red', 'Green', 'Blue'],
      allow_multiple: true,
    };
    const out = formatUserChoiceResult(result);
    expect(out).toContain('3 option(s)');
    expect(out).toContain('- Red');
    expect(out).toContain('- Green');
    expect(out).toContain('- Blue');
  });

  it('formats a cancelled selection', () => {
    const result: UserChoiceResult = {
      ...baseResult({ success: false, cancelled: true }),
      selected_choice: null,
      selected_choices: [],
      allow_multiple: false,
    };
    const out = formatUserChoiceResult(result);
    expect(out).toContain('cancelled');
  });

  it('formats an error', () => {
    const result: UserChoiceResult = {
      ...baseResult({ success: false, error: 'No choices available' }),
      selected_choice: null,
      selected_choices: [],
      allow_multiple: false,
    };
    const out = formatUserChoiceResult(result);
    expect(out).toContain('**Error:**');
    expect(out).toContain('No choices available');
  });

  it('formats single selection when allow_multiple but only one selected', () => {
    const result: UserChoiceResult = {
      ...baseResult(),
      selected_choice: null,
      selected_choices: ['Only'],
      allow_multiple: true,
    };
    const out = formatUserChoiceResult(result);
    expect(out).toContain('1 option(s)');
    expect(out).toContain('- Only');
  });
});

// ---------------------------------------------------------------------------
// formatMultilineInputResult
// ---------------------------------------------------------------------------

describe('formatMultilineInputResult', () => {
  it('formats a successful multiline input', () => {
    const result: MultilineInputResult = {
      ...baseResult(),
      user_input: 'Line 1\nLine 2\nLine 3',
      character_count: 20,
      line_count: 3,
    };
    const out = formatMultilineInputResult(result);
    expect(out).toContain('20 chars');
    expect(out).toContain('3 line(s)');
    expect(out).toContain('```');
    expect(out).toContain('Line 1\nLine 2\nLine 3');
  });

  it('formats empty multiline input', () => {
    const result: MultilineInputResult = {
      ...baseResult(),
      user_input: '',
      character_count: 0,
      line_count: 0,
    };
    const out = formatMultilineInputResult(result);
    expect(out).toContain('0 chars');
    expect(out).toContain('```');
  });

  it('formats null multiline input as empty', () => {
    const result: MultilineInputResult = {
      ...baseResult(),
      user_input: null,
      character_count: 0,
      line_count: 0,
    };
    const out = formatMultilineInputResult(result);
    expect(out).toContain('```\n\n```');
  });

  it('formats a cancelled multiline input', () => {
    const result: MultilineInputResult = {
      ...baseResult({ success: false, cancelled: true }),
      user_input: null,
      character_count: 0,
      line_count: 0,
    };
    const out = formatMultilineInputResult(result);
    expect(out).toContain('cancelled');
  });

  it('formats an error', () => {
    const result: MultilineInputResult = {
      ...baseResult({ success: false, error: 'Editor failed' }),
      user_input: null,
      character_count: 0,
      line_count: 0,
    };
    const out = formatMultilineInputResult(result);
    expect(out).toContain('**Error:**');
    expect(out).toContain('Editor failed');
  });
});

// ---------------------------------------------------------------------------
// formatConfirmationResult
// ---------------------------------------------------------------------------

describe('formatConfirmationResult', () => {
  it('formats confirmed = true', () => {
    const result: ConfirmationResult = {
      ...baseResult(),
      confirmed: true,
      response: 'yes',
    };
    const out = formatConfirmationResult(result);
    expect(out).toContain('**Yes**');
  });

  it('formats confirmed = false', () => {
    const result: ConfirmationResult = {
      ...baseResult(),
      confirmed: false,
      response: 'no',
    };
    const out = formatConfirmationResult(result);
    expect(out).toContain('**No**');
  });

  it('formats a dismissed dialog (cancelled)', () => {
    const result: ConfirmationResult = {
      ...baseResult({ success: false, cancelled: true }),
      confirmed: false,
      response: 'dismissed',
    };
    const out = formatConfirmationResult(result);
    expect(out).toContain('dismissed');
  });

  it('formats an error', () => {
    const result: ConfirmationResult = {
      ...baseResult({ success: false, error: 'Dialog failed' }),
      confirmed: false,
      response: '',
    };
    const out = formatConfirmationResult(result);
    expect(out).toContain('**Error:**');
    expect(out).toContain('Dialog failed');
  });
});

// ---------------------------------------------------------------------------
// formatInfoMessageResult
// ---------------------------------------------------------------------------

describe('formatInfoMessageResult', () => {
  it('formats acknowledged = true', () => {
    const result: InfoMessageResult = {
      ...baseResult(),
      acknowledged: true,
    };
    const out = formatInfoMessageResult(result);
    expect(out).toContain('acknowledged');
  });

  it('formats acknowledged = false', () => {
    const result: InfoMessageResult = {
      ...baseResult(),
      acknowledged: false,
    };
    const out = formatInfoMessageResult(result);
    expect(out).toContain('dismissed');
  });

  it('formats a cancelled (dismissed) message', () => {
    const result: InfoMessageResult = {
      ...baseResult({ success: false, cancelled: true }),
      acknowledged: false,
    };
    const out = formatInfoMessageResult(result);
    expect(out).toContain('dismissed');
  });

  it('formats an error', () => {
    const result: InfoMessageResult = {
      ...baseResult({ success: false, error: 'Message failed' }),
      acknowledged: false,
    };
    const out = formatInfoMessageResult(result);
    expect(out).toContain('**Error:**');
    expect(out).toContain('Message failed');
  });
});

// ---------------------------------------------------------------------------
// formatHealthCheckResult
// ---------------------------------------------------------------------------

describe('formatHealthCheckResult', () => {
  const healthResult: HealthCheckResult = {
    status: 'healthy',
    gui_available: true,
    server_name: 'human-in-the-loop',
    platform: 'linux',
    platform_details: {
      system: 'Linux',
      release: '6.1.0',
      arch: 'x64',
      hostname: 'dev-machine',
      isWSL: false,
    },
    extension_version: '1.5.0',
    tools_available: [
      'get_user_input',
      'get_user_choice',
      'get_multiline_input',
      'show_confirmation_dialog',
      'show_info_message',
    ],
  };

  it('includes the status', () => {
    const out = formatHealthCheckResult(healthResult);
    expect(out).toContain('**Status:** healthy');
  });

  it('includes the platform and arch', () => {
    const out = formatHealthCheckResult(healthResult);
    expect(out).toContain('**Platform:** linux (x64)');
  });

  it('includes WSL flag', () => {
    const out = formatHealthCheckResult(healthResult);
    expect(out).toContain('**WSL:** No');
  });

  it('includes WSL = Yes when isWSL is true', () => {
    const wslResult: HealthCheckResult = {
      ...healthResult,
      platform_details: { ...healthResult.platform_details, isWSL: true },
    };
    const out = formatHealthCheckResult(wslResult);
    expect(out).toContain('**WSL:** Yes');
  });

  it('includes extension version', () => {
    const out = formatHealthCheckResult(healthResult);
    expect(out).toContain('**Version:** 1.5.0');
  });

  it('includes tools list', () => {
    const out = formatHealthCheckResult(healthResult);
    expect(out).toContain('**Available tools:**');
    expect(out).toContain('get_user_input');
    expect(out).toContain('show_confirmation_dialog');
  });
});
