import { get, set } from 'lodash';
import { schemaSymbol, jsonSymbol, type SchemaErrorDetail } from 'z-schema';

import type { TargetObject } from './JsonSchema';

/**
 * Format error codes that indicate validation failures due to format mismatches.
 * These errors can potentially be resolved by converting empty strings to null.
 */
const FORMAT_ERROR_CODES = [
  'PATTERN',
  'ENUM_MISMATCH',
  'INVALID_FORMAT'
] as const;

/**
 * Values that are considered "empty" and can be safely converted to null.
 */
const EMPTY_VALUES = [''] as const;

/**
 * Converts empty string values to null for specific format validation errors.
 * 
 * **Intent:**
 * This function provides a post-validation normalization strategy that attempts to
 * resolve format validation errors by converting empty strings to null. This is
 * particularly useful when dealing with optional fields where an empty string
 * represents "no value provided" rather than an invalid format. By converting
 * empty strings to null, the validation may pass if the schema allows null values
 * for optional fields.
 * 
 * **Use Cases:**
 * - **Optional field normalization**: When optional string fields receive empty
 *   strings from user input or API responses, converting them to null allows
 *   validation to succeed if the schema permits null values for optional fields.
 *   This is especially common with form inputs that submit empty strings instead
 *   of omitting fields entirely.
 * - **Format error recovery**: After schema validation fails with format errors
 *   (pattern mismatch, enum mismatch, invalid format), this function attempts to
 *   resolve errors by nullifying empty strings. This enables graceful handling
 *   of optional fields that failed format validation due to empty values.
 * - **API integration**: When integrating with external APIs or services that
 *   send empty strings for optional fields, this function normalizes the data
 *   to use null instead, which is often more semantically correct for optional
 *   fields in JSON schemas.
 * - **Data transformation pipeline**: As part of a validation and normalization
 *   pipeline, this function can be used to clean and normalize data before
 *   further processing or storage, ensuring consistent representation of
 *   "missing" values.
 * - **User input handling**: When processing user-submitted forms or data where
 *   empty string inputs should be treated as "not provided" rather than invalid,
 *   this function converts them to null for proper schema validation.
 * 
 * **Behavior:**
 * - Returns a deep clone of the input object (does not mutate the original)
 * - Only processes format-related errors (PATTERN, ENUM_MISMATCH, INVALID_FORMAT)
 * - Skips required attributes (marked with `x-required: true`)
 * - Only converts empty strings (`''`) to null, preserving other values
 * - Supports nested paths and array indices
 * - Returns both the modified object and remaining validation errors that
 *   couldn't be resolved
 * 
 * **Examples:**
 * 
 * ```typescript
 * // Example 1: Basic usage with pattern error
 * const object = { email: '' };
 * const error = {
 *   code: 'PATTERN',
 *   path: '#/email',
 *   // ... other error properties
 * };
 * const [result, remainingErrors] = nullifyEmptyValues(object, [error]);
 * // result: { email: null }
 * // remainingErrors: []
 * ```
 * 
 * ```typescript
 * // Example 2: Required fields are not nullified
 * const object = { requiredField: '', optionalField: '' };
 * const requiredError = {
 *   code: 'PATTERN',
 *   path: '#/requiredField',
 *   // schema has x-required: true
 * };
 * const optionalError = {
 *   code: 'PATTERN',
 *   path: '#/optionalField',
 *   // schema has no x-required or x-required: false
 * };
 * const [result, remainingErrors] = nullifyEmptyValues(
 *   object,
 *   [requiredError, optionalError]
 * );
 * // result: { requiredField: '', optionalField: null }
 * // remainingErrors: [requiredError] // required field error remains
 * ```
 * 
 * ```typescript
 * // Example 3: Nested paths and arrays
 * const object = {
 *   user: {
 *     profile: {
 *       bio: '',
 *       tags: ['', 'tag1', '']
 *     }
 *   }
 * };
 * const errors = [
 *   { code: 'PATTERN', path: '#/user/profile/bio' },
 *   { code: 'INVALID_FORMAT', path: '#/user/profile/tags/0' },
 *   { code: 'ENUM_MISMATCH', path: '#/user/profile/tags/2' }
 * ];
 * const [result, remainingErrors] = nullifyEmptyValues(object, errors);
 * // result: {
 * //   user: {
 * //     profile: {
 * //       bio: null,
 * //       tags: [null, 'tag1', null]
 * //     }
 * //   }
 * // }
 * // remainingErrors: []
 * ```
 * 
 * ```typescript
 * // Example 4: Non-format errors are not processed
 * const object = { field: '' };
 * const formatError = { code: 'PATTERN', path: '#/field' };
 * const typeError = { code: 'INVALID_TYPE', path: '#/field' };
 * const [result, remainingErrors] = nullifyEmptyValues(
 *   object,
 *   [formatError, typeError]
 * );
 * // result: { field: null }
 * // remainingErrors: [typeError] // type error remains
 * ```
 * 
 * ```typescript
 * // Example 5: Non-empty values are preserved
 * const object = { field: 'invalid-value' };
 * const error = { code: 'PATTERN', path: '#/field' };
 * const [result, remainingErrors] = nullifyEmptyValues(object, [error]);
 * // result: { field: 'invalid-value' } // unchanged
 * // remainingErrors: [error] // error remains
 * ```
 * 
 * @param object - The target object to process (will be deep cloned, not mutated)
 * @param validationErrors - Array of schema validation errors from z-schema
 * @returns A tuple containing:
 *   - `[0]`: Deep clone of the object with empty strings converted to null where applicable
 *   - `[1]`: Array of validation errors that couldn't be resolved (required fields,
 *            non-format errors, or errors for non-empty values)
 */
const nullifyEmptyValues = (
  object: TargetObject,
  validationErrors: SchemaErrorDetail[]
): [TargetObject, SchemaErrorDetail[]] => {
  // Create a deep clone to avoid mutating the original object
  const result = JSON.parse(JSON.stringify(object)) as TargetObject;
  const remainingErrors: SchemaErrorDetail[] = [];

  for (const error of validationErrors) {
    const { code, path: pathString } = error;
    const schema = get(error, schemaSymbol) as Record<string, unknown> | undefined;
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
    const path = pathString.replace(/^#\//, '').split('/').filter(Boolean);

    // Get the actual value from the error's JSON context
    const json = get(error, jsonSymbol) as TargetObject;
    const value = get(json, path);

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
