/**
 * Get User Input tool implementation.
 * Opens a webview modal dialog for the user to enter text, numbers, or other data.
 */

import * as vscode from 'vscode';
import { getPlatformInfo } from '../platform';
import {
  validateRequiredString,
  validateOptionalString,
  validateInputType,
  parseInputValue,
} from '../validation';
import { showDialog } from '../webview';
import type { UserInputResult } from '../types';

/**
 * Build the input validation function based on input type.
 */
export function buildInputValidator(
  inputType: 'text' | 'integer' | 'float'
): ((value: string) => string | undefined) | undefined {
  if (inputType === 'integer') {
    return (value: string) => {
      if (value && isNaN(parseInt(value, 10))) {
        return 'Please enter a valid integer';
      }
      return undefined;
    };
  }
  if (inputType === 'float') {
    return (value: string) => {
      if (value && isNaN(parseFloat(value))) {
        return 'Please enter a valid number';
      }
      return undefined;
    };
  }
  return undefined;
}

/**
 * Execute the get_user_input tool.
 * Opens a centered webview dialog for the user to type input.
 */
export async function executeGetUserInput(
  params: Record<string, unknown>,
  token: vscode.CancellationToken
): Promise<UserInputResult> {
  const platformInfo = getPlatformInfo();
  const platformName = platformInfo.osName;

  try {
    const title = validateRequiredString(params.title, 'title');
    const prompt = validateRequiredString(params.prompt, 'prompt');
    const defaultValue = validateOptionalString(params.defaultValue, 'defaultValue') ?? '';
    const inputType = validateInputType(params.inputType);

    const result = await showDialog(
      {
        type: 'input',
        title,
        prompt,
        defaultValue,
        inputType,
      },
      token
    );

    // Check if cancelled
    if (result.action === 'cancel' || result.value === undefined) {
      return {
        success: false,
        user_input: null,
        input_type: inputType,
        cancelled: true,
        platform: platformName,
      };
    }

    const rawValue = String(result.value);
    const parsedValue = parseInputValue(rawValue, inputType);

    if (parsedValue === null && inputType !== 'text') {
      return {
        success: false,
        user_input: null,
        input_type: inputType,
        cancelled: false,
        platform: platformName,
        error: `Invalid ${inputType} value: ${rawValue}`,
      };
    }

    return {
      success: true,
      user_input: parsedValue,
      input_type: inputType,
      cancelled: false,
      platform: platformName,
    };
  } catch (error) {
    return {
      success: false,
      user_input: null,
      input_type: 'text',
      cancelled: false,
      platform: platformName,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
