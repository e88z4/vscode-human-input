/**
 * Validation utilities for tool parameters.
 */

/**
 * Validate that a required string parameter is present and non-empty.
 */
export function validateRequiredString(value: unknown, paramName: string): string {
  if (value === undefined || value === null) {
    throw new Error(`Missing required parameter: ${paramName}`);
  }
  if (typeof value !== 'string') {
    throw new Error(`Parameter '${paramName}' must be a string, got ${typeof value}`);
  }
  if (value.trim().length === 0) {
    throw new Error(`Parameter '${paramName}' must not be empty`);
  }
  return value;
}

/**
 * Validate that an optional string parameter is valid if present.
 */
export function validateOptionalString(value: unknown, paramName: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error(`Parameter '${paramName}' must be a string, got ${typeof value}`);
  }
  return value;
}

/**
 * Validate input type parameter.
 */
export function validateInputType(value: unknown): 'text' | 'integer' | 'float' {
  const validTypes = ['text', 'integer', 'float'] as const;
  if (value === undefined || value === null) {
    return 'text';
  }
  if (typeof value !== 'string' || !validTypes.includes(value as typeof validTypes[number])) {
    throw new Error(`Parameter 'inputType' must be one of: ${validTypes.join(', ')}`);
  }
  return value as 'text' | 'integer' | 'float';
}

/**
 * Validate choices array parameter.
 */
export function validateChoices(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error("Parameter 'choices' must be an array");
  }
  if (value.length === 0) {
    throw new Error("Parameter 'choices' must not be empty");
  }
  const validated = value.map((item, index) => {
    if (typeof item !== 'string') {
      throw new Error(`Choice at index ${index} must be a string, got ${typeof item}`);
    }
    return item;
  });
  return validated;
}

/**
 * Validate boolean parameter with default.
 */
export function validateBoolean(value: unknown, defaultValue: boolean): boolean {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value !== 'boolean') {
    throw new Error(`Expected boolean, got ${typeof value}`);
  }
  return value;
}

/**
 * Validate user input value based on input type.
 * Returns the parsed value or null if invalid.
 */
export function parseInputValue(
  value: string,
  inputType: 'text' | 'integer' | 'float'
): string | number | null {
  if (inputType === 'integer') {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      return null;
    }
    return parsed;
  }
  if (inputType === 'float') {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      return null;
    }
    return parsed;
  }
  return value;
}
