import type { SchemaErrorDetail } from 'z-schema';

import { TargetObject } from './helpers/JsonSchema';

/** Normalized validation error */
class ValidationError extends Error {
  private _object: TargetObject;
  private _schemaId: string;
  private _validationErrors: {
    path: string;
    code: string;
    params: string[];
    message: string;
  }[];

  /** Create validation error */
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

  /** Returns JSON serializable object */
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
