import { get, set } from 'lodash';
import ZSchema, { type SchemaErrorDetail } from 'z-schema';

/**
 * Format error codes that indicate validation failures due to format mismatches.
 * These errors can potentially be resolved by converting empty strings to null.
 */
const FORMAT_ERROR_CODES = [
  'PATTERN',
  'ENUM_MISMATCH',
  'INVALID_FORMAT'
] as const;

/** Values that are considered "empty" and can be safely converted to null. */
const EMPTY_VALUES = [''] as const;

/** Converts empty string values to null for specific format validation errors. */
const nullifyEmptyValues = (
  object: TargetObject,
  validationErrors: SchemaErrorDetail[]
): [TargetObject, SchemaErrorDetail[]] => {
  // Create a deep clone to avoid mutating the original object
  const result = JSON.parse(JSON.stringify(object)) as TargetObject;
  const remainingErrors: SchemaErrorDetail[] = [];

  for (const error of validationErrors) {
    const { code, path: pathString } = error;
    const schema = get(error, ZSchema.schemaSymbol) as Record<string, unknown> | undefined;
    const isAttributeRequired = schema?.['x-required'] === true;
    const isFormatError = FORMAT_ERROR_CODES.includes(code as typeof FORMAT_ERROR_CODES[number]);

    const shouldSkipRequiredAttribute = isAttributeRequired;
    const shouldSkipNonFormatError = !isFormatError;

    // Skip required attributes - they should not be nullified
    if (shouldSkipRequiredAttribute) {
      remainingErrors.push(error);
      continue;
    }

    // Only process format-related errors
    if (shouldSkipNonFormatError) {
      remainingErrors.push(error);
      continue;
    }

    // Parse the JSON path (e.g., '#/user/profile/field' -> ['user', 'profile', 'field'])
    const path = typeof pathString === 'string'
      ? pathString.replace(/^#\//, '').split('/').filter(Boolean)
      : pathString;

    // Get the actual value from the error's JSON context, or fall back to the object
    const json = get(error, ZSchema.jsonSymbol) as TargetObject | undefined;
    const value = get(json ?? result, path);

    const isEmptyValue = EMPTY_VALUES.includes(value as typeof EMPTY_VALUES[number]);
    const shouldSkipNonEmptyValue = !isEmptyValue;

    // Only nullify if the value is actually empty
    if (shouldSkipNonEmptyValue) {
      remainingErrors.push(error);
      continue;
    }

    // Set the value to null in the result object
    set(result, path, null);
  }

  return [result, remainingErrors];
};

export default nullifyEmptyValues;
