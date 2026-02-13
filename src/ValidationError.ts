import type { SchemaErrorDetail } from 'z-schema';

export type ValidationErrorOutput = {
  path: string;
  code: string;
  params: string[];
  message: string;
}

/** Normalized validation error thrown when object validation fails against a schema. */
class ValidationError extends Error {
  private _object: TargetObject;
  private _schemaId: string;
  private _validationErrors: ValidationErrorOutput[];

  /** Creates a validation error instance. */
  constructor(schemaId: string, invalidObject: TargetObject, validationErrors: SchemaErrorDetail[]) {
    super(`"${schemaId}" validation failed`);

    this._object = invalidObject;

    this._schemaId = schemaId;

    this._validationErrors = validationErrors
      .map(error => ({
        path: error.path as string,
        code: error.code,
        params: error.params as string[],
        message: error.message,
      }));
  }

  /** Returns a JSON serializable representation of the validation error. */
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
