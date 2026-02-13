import { keyBy, groupBy } from 'lodash';
import ZSchema, { type JsonSchema, ValidateError } from 'z-schema';

import got from './helpers/got';
import Schema from './Schema';
import cleanupNulls from './helpers/cleanupNulls';
import getReferenceIds from './helpers/getReferenceIds';
import ValidationError from './ValidationError';
import cleanupAttributes from './helpers/cleanupAttributes';
import nullifyEmptyValues from './helpers/nullifyEmptyValues';
import normalizeAttributes from './helpers/normalizeAttributes';

/** Validator for validating and normalizing objects against JSON schemas. */
class Validator {
  private _engine: ZSchema;
  private _schemasMap: Record<string, Schema>;
  private _jsonSchemasMap: Record<string, JsonSchema>;

  /** Creates a validator instance for a collection of schemas. */
  constructor(schemas: Schema[] | undefined) {
    if (!schemas) {
      throw new Error('No schemas provided');
    }

    const groupsById = groupBy(schemas, 'id');

    for (const id in groupsById) {
      const schemas = groupsById[id];
      const hasDuplicates = schemas.length > 1;

      if (hasDuplicates) {
        throw new Error(`Multiple schemas provided for ID: ${id}`);
      }
    }

    this._engine = ZSchema.create({
      reportPathAsArray: false,
      ignoreUnknownFormats: true,
    });

    const jsonSchemas = schemas.map(({ jsonSchema }) => jsonSchema);

    try {
      this._engine.validateSchema(jsonSchemas as JsonSchema);
    } catch (error) {
      const details = error instanceof ValidateError && error.details ? error.details : [];
      const errorsJson = JSON.stringify(details, null, 2);
      throw new Error(`Schemas validation failed, errors: ${errorsJson}`);
    }

    this._schemasMap = keyBy(schemas, 'id');
    this._jsonSchemasMap = keyBy(jsonSchemas, 'id');
  }

  /** Validates, cleans, and normalizes an object against a registered schema. */
  validate(
    object: TargetObject,
    schemaId: string,
    shouldNullifyEmptyValues = false,
    shouldCleanupNulls = false
  ) {
    const jsonSchema = got(this._jsonSchemasMap, schemaId, 'Schema "$PATH" not found');

    const objectJson = JSON.stringify(object);
    let result = JSON.parse(objectJson);

    if (shouldCleanupNulls) {
      result = cleanupNulls(result);
    }

    try {
      // NOTE: Drop attributes from objects that are not defined in schema.
      //       This is bad for FE developers, as they continue to send some
      //       trash to endpoints, but good for integrations with third party
      //       services, e.g. Telegram, when you do not want to define schema
      //       for the full payload. This method currently fails for cases when
      //       attribute is defined as object or array in schema, but value is
      //       a string. In this case validation method below would catch that.
      cleanupAttributes(result, jsonSchema, this._jsonSchemasMap);

      // NOTE: Normalize method helps to integrate objects built from URLs,
      //       where types are not defined, e.g. booleans are '1', 'yes' string
      //       or numbers are '1', '2'... strings.
      normalizeAttributes(result, jsonSchema, this._jsonSchemasMap);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // NOTE: Skip errors in cleanup and normalize attributes methods.
      //       Validation would fail below for objects with invalid value types.

    }

    const validationResult = this._engine.validateSafe(result, jsonSchema as JsonSchema);

    if (validationResult.valid) {
      return result;
    }

    const validationErrors = validationResult.err?.details ?? [];

    if (!shouldNullifyEmptyValues) {
      throw new ValidationError(schemaId, result, validationErrors);
    }

    const [ nullifiedResult, updatedValidationErrors ] = nullifyEmptyValues(result, validationErrors);

    const hasValidationErrors = updatedValidationErrors.length > 0;

    if (hasValidationErrors) {
      throw new ValidationError(schemaId, result, updatedValidationErrors);
    }

    return nullifiedResult;
  }

  /** Normalizes object attributes using a schema without performing validation. */
  normalize(object: TargetObject, schemaId: string) {
    const jsonSchema = got(this._jsonSchemasMap, schemaId, 'Schema "$PATH" not found');
    const result = JSON.parse(JSON.stringify(object));

    normalizeAttributes(result, jsonSchema, this._jsonSchemasMap);

    return result;
  }

  /** Returns a map of all registered schemas by their IDs. */
  get schemasMap() {
    return this._schemasMap;
  }

  /** Returns the IDs of all schemas referenced by the specified schema. */
  getReferenceIds(schemaId: string) {
    const schema = got(this.schemasMap, schemaId, 'Schema "$PATH" not found');

    return getReferenceIds(schema, this._schemasMap);
  }
}

export default Validator;
