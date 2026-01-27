type ValueType = 'number' | 'integer' | 'boolean' | 'string' | 'object' | 'array';

const BOOLEAN_STRING_TRUE_VALUES = ['yes', 'true', '1'];
const BOOLEAN_STRING_FALSE_VALUES = ['no', 'false', '0'];

/**
 * Checks if a value is null or undefined.
 *
 * @param value - The value to check
 * @returns True if the value is null or undefined, false otherwise
 */
const isNullOrUndefined = (value: unknown): value is null | undefined =>
  value === null || value === undefined;

/**
 * Checks if a JSON Schema type is numeric (number or integer).
 *
 * @param type - The JSON Schema type to check
 * @returns True if the type is 'number' or 'integer', false otherwise
 */
const isNumericType = (type: ValueType): boolean => type === 'number' || type === 'integer';

/**
 * Checks if a JSON Schema type is boolean.
 *
 * @param type - The JSON Schema type to check
 * @returns True if the type is 'boolean', false otherwise
 */
const isBooleanType = (type: ValueType): boolean => type === 'boolean';

/**
 * Type guard that checks if a value is a number.
 *
 * @param value - The value to check
 * @returns True if the value is a number, false otherwise
 */
const isNumberValue = (value: unknown): value is number => typeof value === 'number';

/**
 * Type guard that checks if a value is a boolean.
 *
 * @param value - The value to check
 * @returns True if the value is a boolean, false otherwise
 */
const isBooleanValue = (value: unknown): value is boolean => typeof value === 'boolean';

/**
 * Type guard that checks if a value is a string.
 *
 * @param value - The value to check
 * @returns True if the value is a string, false otherwise
 */
const isStringValue = (value: unknown): value is string => typeof value === 'string';

/**
 * Checks if a string is empty or contains only whitespace characters.
 *
 * @param value - The string to check
 * @returns True if the string is empty or whitespace-only, false otherwise
 */
const isEmptyOrWhitespaceString = (value: string): boolean =>
  value === '' || value.trim() === '';

/**
 * Checks if a number is valid (not NaN).
 *
 * @param value - The number to check
 * @returns True if the number is valid (not NaN), false otherwise
 */
const isValidNumber = (value: number): boolean => !isNaN(value);

/**
 * Checks if a string represents a boolean true value.
 * Recognized values (case-insensitive): 'yes', 'true', '1'.
 *
 * @param value - The string to check
 * @returns True if the string represents a boolean true value, false otherwise
 */
const isBooleanTrueString = (value: string): boolean =>
  BOOLEAN_STRING_TRUE_VALUES.includes(value.toLowerCase());

/**
 * Checks if a string represents a boolean false value.
 * Recognized values (case-insensitive): 'no', 'false', '0'.
 *
 * @param value - The string to check
 * @returns True if the string represents a boolean false value, false otherwise
 */
const isBooleanFalseString = (value: string): boolean =>
  BOOLEAN_STRING_FALSE_VALUES.includes(value.toLowerCase());

/**
 * Normalizes a value to match a specified JSON Schema type.
 *
 * ## Intent
 *
 * This function is designed to coerce values into their expected types based on JSON Schema
 * type definitions. It's particularly useful when processing data from external sources (like
 * form inputs, query parameters, or API responses) where values may arrive as strings but
 * need to be converted to their proper types according to a schema definition.
 *
 * The function performs type coercion where appropriate, but preserves the original value
 * when conversion is not possible or when the value is already of the correct type. This
 * makes it safe to use in data normalization pipelines without losing information.
 *
 * ## Use Cases
 *
 * 1. **Schema-based data normalization**: When processing objects against JSON Schema
 *    definitions, ensuring property values match their declared types.
 *
 * 2. **Form data processing**: Converting string values from HTML forms (which are always
 *    strings) to their expected types (numbers, booleans) based on schema definitions.
 *
 * 3. **API response normalization**: Normalizing API responses where types may be ambiguous
 *    or incorrectly serialized (e.g., numbers as strings, booleans as strings).
 *
 * 4. **Configuration parsing**: Parsing configuration values from environment variables or
 *    config files where everything is initially a string but needs type coercion.
 *
 * ## Behavior by Type
 *
 * - **number/integer**: Attempts to convert strings and booleans to numbers. Preserves
 *   original value if conversion fails or value is already a number.
 *
 * - **boolean**: Converts numbers (0 → false, non-zero → true) and recognized string
 *   values ('yes', 'true', '1' → true; 'no', 'false', '0' → false). Preserves original
 *   value for unrecognized strings or non-convertible types.
 *
 * - **string/object/array**: Returns the value as-is (no conversion performed).
 *
 * - **null/undefined**: Always preserved regardless of target type.
 *
 * ## Examples
 *
 * ### Number Conversion
 * ```typescript
 * normalizeType('number', '123')      // → 123
 * normalizeType('number', '45.67')    // → 45.67
 * normalizeType('number', '0')        // → 0
 * normalizeType('number', true)       // → 1
 * normalizeType('number', 'abc')      // → 'abc' (conversion failed, original preserved)
 * ```
 *
 * ### Boolean Conversion
 * ```typescript
 * normalizeType('boolean', 0)         // → false
 * normalizeType('boolean', 1)         // → true
 * normalizeType('boolean', 'yes')     // → true
 * normalizeType('boolean', 'true')    // → true
 * normalizeType('boolean', '1')       // → true
 * normalizeType('boolean', 'no')      // → false
 * normalizeType('boolean', 'false')   // → false
 * normalizeType('boolean', 'maybe')   // → 'maybe' (unrecognized, original preserved)
 * ```
 *
 * ### Type Preservation
 * ```typescript
 * normalizeType('string', 'hello')    // → 'hello'
 * normalizeType('string', 123)        // → 123 (no conversion for string type)
 * normalizeType('object', { a: 1 })   // → { a: 1 }
 * normalizeType('array', [1, 2, 3])   // → [1, 2, 3]
 * normalizeType('number', null)       // → null (null always preserved)
 * ```
 *
 * @param type - The target JSON Schema type ('number', 'integer', 'boolean', 'string', 'object', 'array')
 * @param value - The value to normalize (can be any type)
 * @returns The normalized value, or the original value if normalization is not applicable
 */
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
