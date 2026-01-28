import type { SchemaErrorDetail } from 'z-schema';

import { TargetObject } from './helpers/JsonSchema';

export type ValidationErrorOutput = {
  path: string;
  code: string;
  params: string[];
  message: string;
}

/**
 * Normalized validation error thrown when object validation fails against a schema.
 *
 * This error is thrown by the Validator when an object does not conform to its schema.
 * It extends the standard Error class and provides structured access to validation
 * failure details, including the schema ID, the invalid object, and normalized error
 * information for each validation failure.
 *
 * @example
 * ```typescript
 * try {
 *   validator.validate(userData, 'UserSchema');
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     const errorDetails = error.toJSON();
 *     console.error(errorDetails.schemaId); // 'UserSchema'
 *     console.error(errorDetails.validationErrors); // Array of validation failures
 *   }
 * }
 * ```
 */
class ValidationError extends Error {
  private _object: TargetObject;
  private _schemaId: string;
  private _validationErrors: ValidationErrorOutput[];

  /**
   * Creates a validation error instance.
   *
   * @param schemaId - The identifier of the schema that failed validation
   * @param invalidObject - The object that failed validation (may be partially processed)
   * @param validationErrors - Array of validation error details from z-schema, which will be
   *                          normalized to extract only path, code, params, and message
   */
  constructor(schemaId: string, invalidObject: TargetObject, validationErrors: SchemaErrorDetail[]) {
    super(`"${schemaId}" validation failed`);

    this._object = invalidObject;

    this._schemaId = schemaId;

    this._validationErrors = validationErrors
      .map(error => ({
        path: error.path,
        code: error.code,
        params: error.params,
        message: error.message,
      }));
  }

  /**
   * Returns a JSON serializable representation of the validation error.
   *
   * This method is useful for:
   * - API error responses (can be directly serialized and sent to clients)
   * - Logging validation failures in a structured format
   * - Error reporting and debugging
   *
   * @returns An object containing:
   *   - `code`: The error class name ('ValidationError')
   *   - `object`: The invalid object that failed validation
   *   - `message`: The error message (e.g., '"SchemaId" validation failed')
   *   - `schemaId`: The identifier of the schema that failed validation
   *   - `validationErrors`: Array of normalized validation errors, each containing:
   *     - `path`: JSON path to the invalid field (e.g., '#/user/email')
   *     - `code`: Error code from z-schema (e.g., 'INVALID_TYPE', 'REQUIRED')
   *     - `params`: Array of error-specific parameters
   *     - `message`: Human-readable error message
   */
  toJSON() {
    return {
      code: this.constructor.name,
      object: this._object,
      message: this.message,
      schemaId: this._schemaId,
      validationErrors: this._validationErrors
    };
  }
}

export default ValidationError;
