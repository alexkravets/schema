import { get, isUndefined } from 'lodash';

import normalizeType from './normalizeType';
import mapObjectProperties from './mapObjectProperties';
import type { TargetObject, JsonSchema, JsonSchemasMap, PropertySchema } from './JsonSchema';

/**
 * Normalizes object attribute values based on a JSON Schema definition.
 *
 * ## Intent
 *
 * This function ensures that object properties conform to their schema definitions by:
 * 1. Setting default values for properties that are undefined (but not null)
 * 2. Normalizing existing values to match their schema-defined types (e.g., converting
 *    string "123" to number 123, or string "true" to boolean true)
 *
 * The function operates recursively, processing nested objects, arrays, and referenced
 * schemas ($ref) to ensure all properties throughout the object tree are normalized
 * according to their respective schema definitions.
 *
 * This is particularly useful in data processing pipelines where data may come from
 * external sources (forms, APIs, databases) with inconsistent types, but needs to be
 * normalized before validation or further processing.
 *
 * ## Use Cases
 *
 * 1. **Form data processing**: HTML forms submit all values as strings. This function
 *    converts them to their expected types (numbers, booleans) based on schema definitions
 *    and fills in default values for missing fields.
 *
 * 2. **API response normalization**: When consuming APIs that return loosely-typed data
 *    (e.g., numbers as strings, booleans as strings), this function ensures values match
 *    the expected schema types before validation or business logic processing.
 *
 * 3. **Configuration object initialization**: Setting default values and normalizing types
 *    for configuration objects based on their schema definitions, ensuring consistent
 *    structure and types throughout the application.
 *
 * 4. **Data migration and transformation**: Normalizing data structures during migration
 *    or transformation processes where source data may have inconsistent types but target
 *    schema requires specific types.
 *
 * 5. **Pre-validation normalization**: Preparing objects for schema validation by ensuring
 *    types are correct and defaults are applied, reducing validation errors and improving
 *    data quality.
 *
 * ## Behavior
 *
 * - **Default values**: Properties that are `undefined` will be set to their schema-defined
 *   default value (if one exists). Properties that are `null` are left as `null` and will
 *   not receive default values. Default values are also normalized according to their type
 *   (e.g., a default string "123" with type "number" will be converted to the number 123).
 *
 * - **Type normalization**: Properties with existing values (including default values that
 *   were just set) are normalized to match their schema type using `normalizeType`. This
 *   includes converting strings to numbers/booleans where appropriate, while preserving the
 *   original value if conversion is not possible.
 *
 * - **Recursive processing**: The function processes nested objects, arrays, and schema
 *   references ($ref) recursively, ensuring all nested properties are normalized.
 *
 * - **Non-destructive**: The function mutates the input object in place. If you need to
 *   preserve the original, create a deep copy before calling this function.
 *
 * ## Examples
 *
 * ### Basic Usage: Default Values and Type Normalization
 * ```typescript
 * import Schema from './Schema';
 * import normalizeAttributes from './normalizeAttributes';
 *
 * const schema = new Schema({
 *   name: { type: 'string', default: 'Anonymous' },
 *   age: { type: 'number' },
 *   isActive: { type: 'boolean', default: false }
 * }, 'user-schema');
 *
 * const user = {
 *   age: '25'  // string that should be a number
 * };
 *
 * normalizeAttributes(user, schema.jsonSchema, {});
 *
 * // Result:
 * // {
 * //   name: 'Anonymous',      // default value applied
 * //   age: 25,                // string converted to number
 * //   isActive: false         // default value applied
 * // }
 * ```
 *
 * ### Nested Objects
 * ```typescript
 * const schema = new Schema({
 *   address: {
 *     type: 'object',
 *     properties: {
 *       street: { type: 'string', default: 'Unknown' },
 *       zipCode: { type: 'number' }
 *     }
 *   }
 * }, 'profile-schema');
 *
 * const profile = {
 *   address: {
 *     zipCode: '12345'  // string that should be a number
 *   }
 * };
 *
 * normalizeAttributes(profile, schema.jsonSchema, {});
 *
 * // Result:
 * // {
 * //   address: {
 * //     street: 'Unknown',  // default value applied
 * //     zipCode: 12345      // string converted to number
 * //   }
 * // }
 * ```
 *
 * ### Arrays with Schema References
 * ```typescript
 * const itemSchema = new Schema({
 *   id: { type: 'number' },
 *   name: { type: 'string', default: 'Unnamed' }
 * }, 'item-schema');
 *
 * const schema = new Schema({
 *   items: {
 *     type: 'array',
 *     items: { $ref: 'item-schema' }
 *   }
 * }, 'collection-schema');
 *
 * const collection = {
 *   items: [
 *     { id: '1' },           // id is a string, should be number
 *     { id: '2', name: 'Item 2' }
 *   ]
 * };
 *
 * const schemasMap = {
 *   'item-schema': itemSchema.jsonSchema
 * };
 *
 * normalizeAttributes(collection, schema.jsonSchema, schemasMap);
 *
 * // Result:
 * // {
 * //   items: [
 * //     { id: 1, name: 'Unnamed' },  // id normalized, default name applied
 * //     { id: 2, name: 'Item 2' }    // id normalized, existing name preserved
 * //   ]
 * // }
 * ```
 *
 * ### Boolean Normalization
 * ```typescript
 * const schema = new Schema({
 *   enabled: { type: 'boolean', default: false },
 *   verified: { type: 'boolean' }
 * }, 'settings-schema');
 *
 * const settings = {
 *   verified: 'yes'  // string that should be boolean
 * };
 *
 * normalizeAttributes(settings, schema.jsonSchema, {});
 *
 * // Result:
 * // {
 * //   enabled: false,   // default value applied
 * //   verified: true    // string "yes" converted to boolean true
 * // }
 * ```
 *
 * ### Handling Null Values
 * ```typescript
 * const schema = new Schema({
 *   optionalField: { type: 'string', default: 'default-value' }
 * }, 'test-schema');
 *
 * const obj1 = {};                    // undefined → default applied
 * const obj2 = { optionalField: null }; // null → no default applied
 *
 * normalizeAttributes(obj1, schema.jsonSchema, {});
 * normalizeAttributes(obj2, schema.jsonSchema, {});
 *
 * // obj1: { optionalField: 'default-value' }
 * // obj2: { optionalField: null }  // null preserved, default not applied
 * ```
 *
 * ### Default Value Normalization
 * ```typescript
 * const schema = new Schema({
 *   count: { type: 'number', default: '42' },      // default is string, type is number
 *   enabled: { type: 'boolean', default: 'true' }   // default is string, type is boolean
 * }, 'config-schema');
 *
 * const config = {};
 *
 * normalizeAttributes(config, schema.jsonSchema, {});
 *
 * // Result:
 * // {
 * //   count: 42,      // default string "42" normalized to number
 * //   enabled: true   // default string "true" normalized to boolean
 * // }
 * ```
 *
 * @param object - The target object to normalize (mutated in place)
 * @param jsonSchema - The JSON Schema definition describing the object structure
 * @param jsonSchemasMap - Map of schema IDs to schema definitions, used for resolving $ref references
 * @returns void (mutates the input object)
 */
const normalizeAttributes = (object: TargetObject, jsonSchema: JsonSchema, jsonSchemasMap: JsonSchemasMap) => {
  /** Callback to normalize value based on property type defined in schema */
  const callback = (propertyName: string, propertySchema: PropertySchema, object: TargetObject) => {
    let value = object[propertyName];

    const type = get(propertySchema, 'type');
    const defaultValue = get(propertySchema, 'default');

    const hasValue = !isUndefined(value);
    const hasDefaultValue = !isUndefined(defaultValue);
    const shouldSetDefaultValue = hasDefaultValue && !hasValue;

    // Set default value if property is undefined and default exists
    if (shouldSetDefaultValue) {
      object[propertyName] = defaultValue;
      value = defaultValue; // Update value reference for normalization
    }

    const hasType = !!type;
    const hasValueAfterDefault = !isUndefined(value);
    const shouldNormalizeValue = hasType && hasValueAfterDefault;

    // Normalize the current value (original or default) if type is defined
    if (shouldNormalizeValue) {
      object[propertyName] = normalizeType(type, value);
    }
  };

  mapObjectProperties(object, jsonSchema, jsonSchemasMap, callback);
};

export default normalizeAttributes;
