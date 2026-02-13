type ValueType = 'number' | 'integer' | 'boolean' | 'string' | 'object' | 'array';

const BOOLEAN_STRING_TRUE_VALUES = ['yes', 'true', '1'];
const BOOLEAN_STRING_FALSE_VALUES = ['no', 'false', '0'];

/** Checks if a value is null or undefined. */
const isNullOrUndefined = (value: unknown): value is null | undefined =>
  value === null || value === undefined;

/** Checks if a JSON Schema type is numeric (number or integer). */
const isNumericType = (type: ValueType): boolean => type === 'number' || type === 'integer';

/** Checks if a JSON Schema type is boolean. */
const isBooleanType = (type: ValueType): boolean => type === 'boolean';

/** Type guard that checks if a value is a number. */
const isNumberValue = (value: unknown): value is number => typeof value === 'number';

/** Type guard that checks if a value is a boolean. */
const isBooleanValue = (value: unknown): value is boolean => typeof value === 'boolean';

/** Type guard that checks if a value is a string. */
const isStringValue = (value: unknown): value is string => typeof value === 'string';

/** Checks if a string is empty or contains only whitespace characters. */
const isEmptyOrWhitespaceString = (value: string): boolean =>
  value === '' || value.trim() === '';

/** Checks if a number is valid (not NaN). */
const isValidNumber = (value: number): boolean => !isNaN(value);

/** Checks if a string represents a boolean true value. */
const isBooleanTrueString = (value: string): boolean =>
  BOOLEAN_STRING_TRUE_VALUES.includes(value.toLowerCase());

/** Checks if a string represents a boolean false value. */
const isBooleanFalseString = (value: string): boolean =>
  BOOLEAN_STRING_FALSE_VALUES.includes(value.toLowerCase());

/** Normalizes a value to match a specified JSON Schema type. */
const normalizeType = (type: ValueType, value: unknown): string | number | boolean | unknown => {
  // Preserve null and undefined values regardless of target type
  if (isNullOrUndefined(value)) {
    return value;
  }

  // Handle number and integer types
  if (isNumericType(type)) {
    // If already a number, return as-is
    if (isNumberValue(value)) {
      return value;
    }

    // Convert booleans to numbers: true → 1, false → 0
    if (isBooleanValue(value)) {
      return value ? 1 : 0;
    }

    // Attempt conversion for strings
    if (isStringValue(value)) {
      // Preserve empty strings and whitespace-only strings
      if (isEmptyOrWhitespaceString(value)) {
        return value;
      }

      const converted = Number(value);
      // Check if conversion was successful (not NaN)
      if (isValidNumber(converted)) {
        return converted;
      }
    }

    // Return original value if conversion failed or type is not convertible
    return value;
  }

  // Handle boolean type
  if (isBooleanType(type)) {
    // If already a boolean, return as-is
    if (isBooleanValue(value)) {
      return value;
    }

    // Convert numbers: 0 → false, non-zero → true
    if (isNumberValue(value)) {
      return Boolean(value);
    }

    // Convert recognized string values
    if (isStringValue(value)) {
      if (isBooleanTrueString(value)) {
        return true;
      }
      if (isBooleanFalseString(value)) {
        return false;
      }
    }

    // Return original value for unrecognized strings or non-convertible types
    return value;
  }

  // For string, object, and array types, return value as-is (no conversion)
  return value;
};

export default normalizeType;
