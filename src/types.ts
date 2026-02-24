/**
 * Common types and interfaces for Human-in-the-Loop tools.
 */

/**
 * Base result returned by all tools.
 */
export interface BaseToolResult {
  success: boolean;
  cancelled: boolean;
  platform: string;
  error?: string;
}

/**
 * Result from get_user_input tool.
 */
export interface UserInputResult extends BaseToolResult {
  user_input: string | number | null;
  input_type: string;
}

/**
 * Result from get_user_choice tool.
 */
export interface UserChoiceResult extends BaseToolResult {
  selected_choice: string | null;
  selected_choices: string[];
  allow_multiple: boolean;
}

/**
 * Result from get_multiline_input tool.
 */
export interface MultilineInputResult extends BaseToolResult {
  user_input: string | null;
  character_count: number;
  line_count: number;
}

/**
 * Result from show_confirmation_dialog tool.
 */
export interface ConfirmationResult extends BaseToolResult {
  confirmed: boolean;
  response: string;
}

/**
 * Result from show_info_message tool.
 */
export interface InfoMessageResult extends BaseToolResult {
  acknowledged: boolean;
}

/**
 * Result from health_check tool.
 */
export interface HealthCheckResult {
  status: string;
  gui_available: boolean;
  server_name: string;
  platform: string;
  platform_details: {
    system: string;
    release: string;
    arch: string;
    hostname: string;
    isWSL: boolean;
  };
  extension_version: string;
  tools_available: string[];
}

/**
 * Parameters for get_user_input tool.
 */
export interface GetUserInputParams {
  title: string;
  prompt: string;
  defaultValue?: string;
  inputType?: 'text' | 'integer' | 'float';
}

/**
 * Parameters for get_user_choice tool.
 */
export interface GetUserChoiceParams {
  title: string;
  prompt: string;
  choices: string[];
  allowMultiple?: boolean;
}

/**
 * Parameters for get_multiline_input tool.
 */
export interface GetMultilineInputParams {
  title: string;
  prompt: string;
  defaultValue?: string;
}

/**
 * Parameters for show_confirmation_dialog tool.
 */
export interface ShowConfirmationParams {
  title: string;
  message: string;
}

/**
 * Parameters for show_info_message tool.
 */
export interface ShowInfoMessageParams {
  title: string;
  message: string;
}
