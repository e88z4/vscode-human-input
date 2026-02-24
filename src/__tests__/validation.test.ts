/**
 * Unit tests for validation utilities.
 */

import {
  validateRequiredString,
  validateOptionalString,
  validateInputType,
  validateChoices,
  validateBoolean,
  parseInputValue,
} from '../validation';

describe('validateRequiredString', () => {
  it('should return the string when valid', () => {
    expect(validateRequiredString('hello', 'param')).toBe('hello');
  });

  it('should throw when undefined', () => {
    expect(() => validateRequiredString(undefined, 'param')).toThrow(
      'Missing required parameter: param'
    );
  });

  it('should throw when null', () => {
    expect(() => validateRequiredString(null, 'param')).toThrow(
      'Missing required parameter: param'
    );
  });

  it('should throw when not a string', () => {
    expect(() => validateRequiredString(123, 'param')).toThrow(
      "Parameter 'param' must be a string, got number"
    );
  });

  it('should throw when empty string', () => {
    expect(() => validateRequiredString('', 'param')).toThrow(
      "Parameter 'param' must not be empty"
    );
  });

  it('should throw when whitespace-only string', () => {
    expect(() => validateRequiredString('   ', 'param')).toThrow(
      "Parameter 'param' must not be empty"
    );
  });

  it('should return string with leading/trailing spaces', () => {
    expect(validateRequiredString('  hello  ', 'param')).toBe('  hello  ');
  });
});

describe('validateOptionalString', () => {
  it('should return the string when valid', () => {
    expect(validateOptionalString('hello', 'param')).toBe('hello');
  });

  it('should return undefined when undefined', () => {
    expect(validateOptionalString(undefined, 'param')).toBeUndefined();
  });

  it('should return undefined when null', () => {
    expect(validateOptionalString(null, 'param')).toBeUndefined();
  });

  it('should throw when not a string', () => {
    expect(() => validateOptionalString(123, 'param')).toThrow(
      "Parameter 'param' must be a string, got number"
    );
  });

  it('should allow empty string', () => {
    expect(validateOptionalString('', 'param')).toBe('');
  });
});

describe('validateInputType', () => {
  it('should return "text" by default', () => {
    expect(validateInputType(undefined)).toBe('text');
    expect(validateInputType(null)).toBe('text');
  });

  it('should accept "text"', () => {
    expect(validateInputType('text')).toBe('text');
  });

  it('should accept "integer"', () => {
    expect(validateInputType('integer')).toBe('integer');
  });

  it('should accept "float"', () => {
    expect(validateInputType('float')).toBe('float');
  });

  it('should throw for invalid type', () => {
    expect(() => validateInputType('boolean')).toThrow(
      "Parameter 'inputType' must be one of: text, integer, float"
    );
  });

  it('should throw for non-string type', () => {
    expect(() => validateInputType(42)).toThrow(
      "Parameter 'inputType' must be one of: text, integer, float"
    );
  });
});

describe('validateChoices', () => {
  it('should return valid string array', () => {
    expect(validateChoices(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('should throw when not an array', () => {
    expect(() => validateChoices('not-array')).toThrow(
      "Parameter 'choices' must be an array"
    );
  });

  it('should throw when empty array', () => {
    expect(() => validateChoices([])).toThrow(
      "Parameter 'choices' must not be empty"
    );
  });

  it('should throw when array contains non-strings', () => {
    expect(() => validateChoices(['valid', 123])).toThrow(
      'Choice at index 1 must be a string, got number'
    );
  });

  it('should accept single-item array', () => {
    expect(validateChoices(['only'])).toEqual(['only']);
  });
});

describe('validateBoolean', () => {
  it('should return the boolean value', () => {
    expect(validateBoolean(true, false)).toBe(true);
    expect(validateBoolean(false, true)).toBe(false);
  });

  it('should return default when undefined', () => {
    expect(validateBoolean(undefined, true)).toBe(true);
    expect(validateBoolean(undefined, false)).toBe(false);
  });

  it('should return default when null', () => {
    expect(validateBoolean(null, true)).toBe(true);
  });

  it('should throw when not a boolean', () => {
    expect(() => validateBoolean('true', false)).toThrow(
      'Expected boolean, got string'
    );
  });
});

describe('parseInputValue', () => {
  it('should return string for text type', () => {
    expect(parseInputValue('hello', 'text')).toBe('hello');
  });

  it('should return empty string for text type', () => {
    expect(parseInputValue('', 'text')).toBe('');
  });

  it('should parse valid integer', () => {
    expect(parseInputValue('42', 'integer')).toBe(42);
  });

  it('should parse negative integer', () => {
    expect(parseInputValue('-5', 'integer')).toBe(-5);
  });

  it('should return null for invalid integer', () => {
    expect(parseInputValue('abc', 'integer')).toBeNull();
  });

  it('should return null for empty integer', () => {
    expect(parseInputValue('', 'integer')).toBeNull();
  });

  it('should parse valid float', () => {
    expect(parseInputValue('3.14', 'float')).toBeCloseTo(3.14);
  });

  it('should parse negative float', () => {
    expect(parseInputValue('-2.5', 'float')).toBeCloseTo(-2.5);
  });

  it('should return null for invalid float', () => {
    expect(parseInputValue('abc', 'float')).toBeNull();
  });

  it('should return null for empty float', () => {
    expect(parseInputValue('', 'float')).toBeNull();
  });

  it('should parse integer string as float', () => {
    expect(parseInputValue('42', 'float')).toBe(42);
  });
});
