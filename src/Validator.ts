import ZSchema from 'z-schema';
import { keyBy, groupBy } from 'lodash';

import got from './helpers/got';
import Schema from './Schema';
import cleanupNulls from './helpers/cleanupNulls';
import getReferenceIds from './helpers/getReferenceIds';
import ValidationError from './ValidationError';
import cleanupAttributes from './helpers/cleanupAttributes';
import nullifyEmptyValues from './helpers/nullifyEmptyValues';
import normalizeAttributes from './helpers/normalizeAttributes';
import type { TargetObject, JsonSchemasMap } from './helpers/JsonSchema';

/**
 * Validator for validating and normalizing objects against JSON schemas.
 *
 * **Intent:**
 * The Validator class provides a comprehensive solution for validating objects against JSON schemas
 * with built-in normalization, cleanup, and error handling capabilities. It serves as the primary
 * interface for ensuring data integrity and consistency in applications that work with structured
 * data, particularly in API endpoints, data transformation pipelines, and credential systems.
 *
 * The validator performs several key operations:
 * - Validates objects against registered schemas using JSON Schema validation
 * - Removes attributes not defined in the schema (cleanup)
 * - Normalizes attribute types (e.g., string '1' → boolean true, string '180' → number 180)
 * - Handles empty values by optionally nullifying them for non-required fields
 * - Provides detailed validation errors with structured error information
 *
 * **Use Cases:**
 *
 * 1. **API Request/Response Validation:**
 *    - Validate incoming API requests against defined schemas
 *    - Ensure API responses conform to expected structure
 *    - Clean up extra fields sent by clients
 *    - Normalize data from query parameters or form submissions
 *
 * 2. **Data Integration & Third-Party Services:**
 *    - Integrate with external APIs that send loosely-typed data
 *    - Normalize data from URLs where types are strings (e.g., 'true', '1', '180')
 *    - Clean up payloads before sending to third-party services (e.g., Telegram, webhooks)
 *    - Handle data from systems that don't enforce strict typing
 *
 * 3. **Credential & Identity Systems:**
 *    - Validate verifiable credentials against schema definitions
 *    - Ensure credential subjects conform to expected schemas
 *    - Normalize credential data from various sources
 *
 * 4. **Data Transformation Pipelines:**
 *    - Normalize data types without full validation
 *    - Clean up data structures before processing
 *    - Transform data between different formats while maintaining schema compliance
 *
 * 5. **Form & User Input Processing:**
 *    - Validate and normalize form submissions
 *    - Handle empty values gracefully (nullify empty strings for optional fields)
 *    - Clean up null values from nested objects
 *
 * **Example - Basic Validation:**
 * ```typescript
 * const userSchema = new Schema({
 *   name: { type: 'string', required: true },
 *   email: { type: 'string', format: 'email', required: true },
 *   age: { type: 'number', minimum: 0 }
 * }, 'User');
 *
 * const validator = new Validator([userSchema]);
 *
 * const validUser = validator.validate({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   age: 30
 * }, 'User');
 * // Returns: { name: 'John Doe', email: 'john@example.com', age: 30 }
 * ```
 *
 * **Example - Normalization (String to Type Conversion):**
 * ```typescript
 * // Useful when receiving data from URLs or forms where types are strings
 * const preferencesSchema = new Schema({
 *   height: { type: 'number' },
 *   isNotificationEnabled: { type: 'boolean' }
 * }, 'Preferences');
 *
 * const validator = new Validator([preferencesSchema]);
 *
 * const normalized = validator.validate({
 *   height: '180',              // String '180' → number 180
 *   isNotificationEnabled: '1'  // String '1' → boolean true
 * }, 'Preferences');
 * // Returns: { height: 180, isNotificationEnabled: true }
 * ```
 *
 * **Example - Cleanup (Remove Extra Attributes):**
 * ```typescript
 * const profileSchema = new Schema({
 *   name: { type: 'string', required: true },
 *   email: { type: 'string', required: true }
 * }, 'Profile');
 *
 * const validator = new Validator([profileSchema]);
 *
 * const cleaned = validator.validate({
 *   name: 'John',
 *   email: 'john@example.com',
 *   extraField: 'should be removed',
 *   _internalId: 'should be removed'
 * }, 'Profile', false, true);
 * // Returns: { name: 'John', email: 'john@example.com' }
 * // extraField and _internalId are removed
 * ```
 *
 * **Example - Nullify Empty Values:**
 * ```typescript
 * const profileSchema = new Schema({
 *   name: { type: 'string', required: true },
 *   gender: { enum: ['Male', 'Female', 'Other'] },  // Optional
 *   mobileNumber: { type: 'string', pattern: '^\\d+$' }  // Optional
 * }, 'Profile');
 *
 * const validator = new Validator([profileSchema]);
 *
 * const result = validator.validate({
 *   name: 'John',
 *   gender: '',           // Empty string for optional enum
 *   mobileNumber: ''      // Empty string for optional pattern field
 * }, 'Profile', true);    // shouldNullifyEmptyValues = true
 * // Returns: { name: 'John', gender: null, mobileNumber: null }
 * // Empty values are converted to null for non-required fields
 * ```
 *
 * **Example - Normalization Only (Without Validation):**
 * ```typescript
 * const preferencesSchema = new Schema({
 *   height: { type: 'number' },
 *   isNotificationEnabled: { type: 'boolean', default: false }
 * }, 'Preferences');
 *
 * const validator = new Validator([preferencesSchema]);
 *
 * // Normalize without validation - useful for partial data
 * const normalized = validator.normalize({
 *   height: '180'
 * }, 'Preferences');
 * // Returns: { height: 180, isNotificationEnabled: false }
 * // Applies normalization and defaults without validation
 * ```
 *
 * **Example - Error Handling:**
 * ```typescript
 * const validator = new Validator([userSchema]);
 *
 * try {
 *   validator.validate({
 *     name: '',  // Empty required field
 *     email: 'invalid-email'  // Invalid format
 *   }, 'User');
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     const errorDetails = error.toJSON();
 *     console.error(errorDetails.schemaId);  // 'User'
 *     console.error(errorDetails.validationErrors);
 *     // [
 *     //   { path: '#/name', code: 'MIN_LENGTH', message: '...' },
 *     //   { path: '#/email', code: 'INVALID_FORMAT', message: '...' }
 *     // ]
 *   }
 * }
 * ```
 *
 * **Example - Schema References:**
 * ```typescript
 * const addressSchema = new Schema({
 *   street: { type: 'string', required: true },
 *   city: { type: 'string', required: true }
 * }, 'Address');
 *
 * const userSchema = new Schema({
 *   name: { type: 'string', required: true },
 *   address: { $ref: 'Address' }
 * }, 'User');
 *
 * const validator = new Validator([addressSchema, userSchema]);
 *
 * // Get all schemas referenced by User schema
 * const referencedIds = validator.getReferenceIds('User');
 * // Returns: ['Address']
 * ```
 *
 * **Example - Multiple Schemas:**
 * ```typescript
 * const statusSchema = new Schema({ enum: ['ACTIVE', 'INACTIVE'] }, 'Status');
 * const profileSchema = new Schema({
 *   name: { type: 'string', required: true },
 *   status: { $ref: 'Status' }
 * }, 'Profile');
 *
 * const validator = new Validator([statusSchema, profileSchema]);
 *
 * const result = validator.validate({
 *   name: 'John',
 *   status: 'ACTIVE'
 * }, 'Profile');
 * ```
 */
class Validator {
  private _engine: ZSchema;
  private _schemasMap: Record<string, Schema>;
  private _jsonSchemasMap: JsonSchemasMap;

  /**
   * Creates a validator instance for a collection of schemas.
   *
   * **Intent:** Initialize a validator with a set of schemas that can be used for validation
   * and normalization. The constructor validates that all schemas are valid JSON schemas and
   * that there are no duplicate schema IDs.
   *
   * **Use Cases:**
   * - Initialize a validator with all schemas needed for an application
   * - Set up a validator for a specific domain or module
   * - Create validators for different environments (dev, staging, production)
   *
   * @param schemas - Array of Schema instances to register with this validator.
   *                  All schemas must have unique IDs and valid JSON Schema structure.
   *                  Referenced schemas (via $ref) must be included in this array.
   *
   * @throws Error if no schemas are provided
   * @throws Error if multiple schemas have the same ID
   * @throws Error if any schema has invalid JSON Schema structure or missing references
   *
   * **Example:**
   * ```typescript
   * const userSchema = new Schema({ name: { type: 'string' } }, 'User');
   * const statusSchema = new Schema({ enum: ['ACTIVE', 'INACTIVE'] }, 'Status');
   *
   * const validator = new Validator([userSchema, statusSchema]);
   * ```
   *
   * **Example - With Schema References:**
   * ```typescript
   * const addressSchema = new Schema({
   *   street: { type: 'string' }
   * }, 'Address');
   *
   * const userSchema = new Schema({
   *   name: { type: 'string' },
   *   address: { $ref: 'Address' }  // References Address schema
   * }, 'User');
   *
   * // Both schemas must be provided
   * const validator = new Validator([addressSchema, userSchema]);
   * ```
   */
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

    this._engine = new ZSchema({
      reportPathAsArray: false,
      ignoreUnknownFormats: true,
    });

    const jsonSchemas = schemas.map(({ jsonSchema }) => jsonSchema);
    const isValid = this._engine.validateSchema(jsonSchemas);

    if (!isValid) {
      const { errors } = this._engine.lastReport!;
      const errorsJson = JSON.stringify(errors, null, 2);

      throw new Error(`Schemas validation failed, errors: ${errorsJson}`);
    }

    this._schemasMap = keyBy(schemas, 'id');
    this._jsonSchemasMap = keyBy(jsonSchemas, 'id');
  }

  /**
   * Validates, cleans, and normalizes an object against a registered schema.
   *
   * **Intent:** Perform comprehensive validation and transformation of objects to ensure they
   * conform to schema definitions. This method combines validation, attribute cleanup, type
   * normalization, and optional empty value handling in a single operation.
   *
   * **Use Cases:**
   * - Validate API request payloads before processing
   * - Clean up objects by removing undefined attributes
   * - Normalize data types from loosely-typed sources (URLs, forms, external APIs)
   * - Handle empty values gracefully for optional fields
   * - Prepare data for storage or transmission
   *
   * **Processing Pipeline:**
   * 1. Deep clones the input object
   * 2. Optionally removes null values (if `shouldCleanupNulls` is true)
   * 3. Removes attributes not defined in the schema
   * 4. Normalizes attribute types (string → number/boolean, etc.)
   * 5. Validates against JSON Schema
   * 6. Optionally nullifies empty values for non-required fields
   * 7. Returns validated and normalized object, or throws ValidationError
   *
   * @param object - The object to validate and normalize
   * @param schemaId - The ID of the schema to validate against (must be registered in constructor)
   * @param shouldNullifyEmptyValues - If true, converts empty strings to null for non-required
   *                                   fields that fail format/pattern/enum validation. Useful for
   *                                   handling form submissions where empty fields are sent as ''.
   * @param shouldCleanupNulls - If true, removes null values from the object before processing.
   *                            Useful for cleaning up data structures.
   *
   * @returns The validated, cleaned, and normalized object
   *
   * @throws Error if schema with `schemaId` is not found
   * @throws ValidationError if validation fails (contains detailed error information)
   *
   * **Example - Basic Validation:**
   * ```typescript
   * const validator = new Validator([userSchema]);
   *
   * const result = validator.validate({
   *   name: 'John',
   *   email: 'john@example.com'
   * }, 'User');
   * ```
   *
   * **Example - With Cleanup:**
   * ```typescript
   * const result = validator.validate({
   *   name: 'John',
   *   extraField: 'removed',
   *   nullField: null
   * }, 'User', false, true);
   * // extraField and nullField are removed
   * ```
   *
   * **Example - With Normalization:**
   * ```typescript
   * const result = validator.validate({
   *   name: 'John',
   *   age: '30',              // String → number
   *   isActive: 'true'        // String → boolean
   * }, 'User');
   * // age becomes 30, isActive becomes true
   * ```
   *
   * **Example - Nullify Empty Values:**
   * ```typescript
   * const result = validator.validate({
   *   name: 'John',
   *   optionalEmail: '',      // Empty string
   *   optionalPhone: ''       // Empty string
   * }, 'User', true);
   * // optionalEmail and optionalPhone become null (if not required)
   * ```
   *
   * **Example - Error Handling:**
   * ```typescript
   * try {
   *   validator.validate({ name: '' }, 'User');
   * } catch (error) {
   *   if (error instanceof ValidationError) {
   *     const details = error.toJSON();
   *     // Access error.schemaId, error.validationErrors, etc.
   *   }
   * }
   * ```
   */
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

    const isValid = this._engine.validate(result, jsonSchema);

    if (isValid) {
      return result;
    }

    const validationErrors = this._engine.getLastErrors();

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

  /**
   * Normalizes object attributes using a schema without performing validation.
   *
   * **Intent:** Apply type normalization and default values to an object without the strictness
   * of full validation. This is useful when you want to transform data types but don't need
   * complete schema compliance, or when working with partial/incomplete data.
   *
   * **Use Cases:**
   * - Normalize data types from loosely-typed sources (URLs, query parameters, forms)
   * - Apply default values from schemas to partial objects
   * - Transform data before validation in a separate step
   * - Prepare data for display or processing without strict validation
   * - Handle partial updates where not all fields are present
   *
   * **What It Does:**
   * - Deep clones the input object
   * - Normalizes attribute types (string '1' → boolean true, string '180' → number 180)
   * - Applies default values from schema definitions
   * - Does NOT validate required fields, formats, patterns, or enums
   * - Does NOT remove undefined attributes
   *
   * @param object - The object to normalize
   * @param schemaId - The ID of the schema to use for normalization (must be registered)
   *
   * @returns A new object with normalized types and applied defaults
   *
   * @throws Error if schema with `schemaId` is not found
   *
   * **Example - Type Normalization:**
   * ```typescript
   * const preferencesSchema = new Schema({
   *   height: { type: 'number' },
   *   isNotificationEnabled: { type: 'boolean', default: false }
   * }, 'Preferences');
   *
   * const validator = new Validator([preferencesSchema]);
   *
   * const normalized = validator.normalize({
   *   height: '180',              // String → number
   *   isNotificationEnabled: '1'  // String '1' → boolean true
   * }, 'Preferences');
   * // Returns: { height: 180, isNotificationEnabled: true }
   * ```
   *
   * **Example - Apply Defaults:**
   * ```typescript
   * const userSchema = new Schema({
   *   name: { type: 'string', required: true },
   *   status: { enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
   *   role: { enum: ['USER', 'ADMIN'], default: 'USER' }
   * }, 'User');
   *
   * const validator = new Validator([userSchema]);
   *
   * const normalized = validator.normalize({
   *   name: 'John'
   *   // status and role are not provided
   * }, 'User');
   * // Returns: { name: 'John', status: 'ACTIVE', role: 'USER' }
   * ```
   *
   * **Example - Partial Data:**
   * ```typescript
   * // Useful for partial updates where validation might fail
   * const partial = validator.normalize({
   *   age: '25'  // Only updating age, other fields missing
   * }, 'User');
   * // Normalizes age to number without requiring other fields
   * ```
   */
  normalize(object: TargetObject, schemaId: string) {
    const jsonSchema = got(this._jsonSchemasMap, schemaId, 'Schema "$PATH" not found');
    const result = JSON.parse(JSON.stringify(object));

    normalizeAttributes(result, jsonSchema, this._jsonSchemasMap);

    return result;
  }

  /**
   * Returns a map of all registered schemas by their IDs.
   *
   * **Intent:** Provide access to all schemas registered with this validator, enabling
   * inspection, iteration, or programmatic access to schema definitions.
   *
   * **Use Cases:**
   * - Inspect all available schemas
   * - Iterate over schemas for bulk operations
   * - Access schema metadata or properties
   * - Build UI components that list available schemas
   * - Debug schema registration
   *
   * @returns A record mapping schema IDs to Schema instances
   *
   * **Example:**
   * ```typescript
   * const validator = new Validator([userSchema, statusSchema]);
   *
   * const schemas = validator.schemasMap;
   * // { 'User': Schema instance, 'Status': Schema instance }
   *
   * // Access a specific schema
   * const userSchema = schemas['User'];
   *
   * // Iterate over all schemas
   * Object.keys(schemas).forEach(id => {
   *   console.log(`Schema ${id} is registered`);
   * });
   * ```
   */
  get schemasMap() {
    return this._schemasMap;
  }

  /**
   * Returns the IDs of all schemas referenced by the specified schema.
   *
   * **Intent:** Discover schema dependencies by finding all schemas referenced via `$ref`
   * in a given schema. This is useful for understanding schema relationships and building
   * dependency graphs.
   *
   * **Use Cases:**
   * - Build schema dependency graphs
   * - Validate that all referenced schemas are available
   * - Generate documentation showing schema relationships
   * - Determine which schemas need to be loaded together
   * - Debug schema reference issues
   *
   * @param schemaId - The ID of the schema to analyze for references
   *
   * @returns An array of schema IDs that are referenced by the specified schema
   *
   * @throws Error if schema with `schemaId` is not found
   *
   * **Example:**
   * ```typescript
   * const addressSchema = new Schema({
   *   street: { type: 'string' }
   * }, 'Address');
   *
   * const userSchema = new Schema({
   *   name: { type: 'string' },
   *   address: { $ref: 'Address' },
   *   status: { $ref: 'Status' }
   * }, 'User');
   *
   * const validator = new Validator([addressSchema, statusSchema, userSchema]);
   *
   * const references = validator.getReferenceIds('User');
   * // Returns: ['Address', 'Status']
   * ```
   *
   * **Example - Nested References:**
   * ```typescript
   * // If Address schema also references Country schema
   * const references = validator.getReferenceIds('User');
   * // Returns: ['Address', 'Status', 'Country'] (includes nested references)
   * ```
   */
  getReferenceIds(schemaId: string) {
    const schema = got(this.schemasMap, schemaId, 'Schema "$PATH" not found');

    return getReferenceIds(schema, this._schemasMap);
  }
}

export default Validator;
