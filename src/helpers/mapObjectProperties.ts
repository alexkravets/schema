import { isUndefined } from 'lodash';

import got from './got';
import type {
  JsonSchema,
  EnumSchema,
  ObjectSchema,
  TargetObject,
  PropertySchema,
  JsonSchemasMap,
  ArrayPropertySchema,
  ObjectPropertySchema,
  ReferencePropertySchema,
} from './JsonSchema';

/**
 * Recursively traverses an object's properties based on a JSON schema and applies a callback
 * function to each property. Handles nested objects, arrays, and schema references ($ref).
 *
 * **Intent:**
 * This function provides a generic way to iterate over object properties in a schema-aware manner,
 * enabling operations like normalization, validation, transformation, or cleanup to be applied
 * consistently across complex nested data structures. It abstracts away the complexity of
 * traversing nested objects, arrays, and schema references, allowing callers to focus on
 * implementing their specific property-level logic.
 *
 * **Use Cases:**
 * - **Normalization**: Apply type conversions or default values to properties based on schema definitions
 *   (see `normalizeAttributes.ts` for example)
 * - **Validation**: Check property values against schema constraints
 * - **Transformation**: Modify or transform property values based on schema metadata
 * - **Cleanup**: Remove invalid properties or sanitize data structures
 * - **Data Processing**: Extract, aggregate, or analyze properties across nested structures
 * - **Schema-driven Operations**: Any operation that needs to process object properties according
 *   to their schema definitions
 *
 * **Behavior:**
 * - Skips enum schemas (returns immediately without calling callback)
 * - Calls callback for all properties defined in the schema, even if their values are null
 * - Skips recursion into undefined values (callback is still called, but nested traversal stops)
 * - Recursively processes nested objects by creating nested schema contexts
 * - Recursively processes array items, handling both inline object schemas and references
 * - Resolves schema references ($ref) using the provided schemasMap
 *
 * **Examples:**
 *
 * @example
 * // Example 1: Normalize property values based on schema types
 * const schema = new Schema({
 *   name: { type: 'string' },
 *   age: { type: 'number' },
 *   active: { type: 'boolean' }
 * }, 'user-schema');
 *
 * const user = {
 *   name: 'John',
 *   age: '30', // string that should be number
 *   active: 'true' // string that should be boolean
 * };
 *
 * mapObjectProperties(user, schema.jsonSchema, {}, (propName, propSchema, obj) => {
 *   if (propSchema.type === 'number') {
 *     obj[propName] = Number(obj[propName]);
 *   } else if (propSchema.type === 'boolean') {
 *     obj[propName] = obj[propName] === 'true' || obj[propName] === true;
 *   }
 * });
 * // Result: { name: 'John', age: 30, active: true }
 *
 * @example
 * // Example 2: Process nested objects
 * const schema = new Schema({
 *   profile: {
 *     type: 'object',
 *     properties: {
 *       firstName: { type: 'string' },
 *       lastName: { type: 'string' }
 *     }
 *   }
 * }, 'user-schema');
 *
 * const user = {
 *   profile: {
 *     firstName: 'John',
 *     lastName: 'Doe'
 *   }
 * };
 *
 * const processedProps: string[] = [];
 * mapObjectProperties(user, schema.jsonSchema, {}, (propName) => {
 *   processedProps.push(propName);
 * });
 * // processedProps: ['profile', 'firstName', 'lastName']
 *
 * @example
 * // Example 3: Handle schema references ($ref)
 * const addressSchema = new Schema({
 *   street: { type: 'string' },
 *   city: { type: 'string' }
 * }, 'address-schema');
 *
 * const userSchema = new Schema({
 *   name: { type: 'string' },
 *   address: { $ref: 'address-schema' }
 * }, 'user-schema');
 *
 * const user = {
 *   name: 'John',
 *   address: {
 *     street: '123 Main St',
 *     city: 'New York'
 *   }
 * };
 *
 * const schemasMap = {
 *   'address-schema': addressSchema.jsonSchema
 * };
 *
 * mapObjectProperties(user, userSchema.jsonSchema, schemasMap, (propName) => {
 *   console.log(`Processing: ${propName}`);
 * });
 * // Output:
 * // Processing: name
 * // Processing: address
 * // Processing: street
 * // Processing: city
 *
 * @example
 * // Example 4: Process arrays with object items
 * const schema = new Schema({
 *   tags: {
 *     type: 'array',
 *     items: {
 *       type: 'object',
 *       properties: {
 *         name: { type: 'string' },
 *         value: { type: 'string' }
 *       }
 *     }
 *   }
 * }, 'item-schema');
 *
 * const item = {
 *   tags: [
 *     { name: 'tag1', value: 'value1' },
 *     { name: 'tag2', value: 'value2' }
 *   ]
 * };
 *
 * mapObjectProperties(item, schema.jsonSchema, {}, (propName, propSchema, obj) => {
 *   if (propSchema.type === 'string') {
 *     obj[propName] = String(obj[propName]).toUpperCase();
 *   }
 * });
 * // Result: tags array items have uppercase name and value properties
 *
 * @param object - The target object to traverse
 * @param jsonSchema - The JSON schema defining the object structure
 * @param schemasMap - Map of schema IDs to schema objects for resolving $ref references
 * @param callback - Function called for each property with (propertyName, propertySchema, object)
 */
const mapObjectProperties = (
  object: TargetObject,
  jsonSchema: JsonSchema,
  schemasMap: JsonSchemasMap,
  callback: (propertyName: string, propertySchema: PropertySchema, object: TargetObject) => void
) => {
  const { enum: enumItems } = jsonSchema as EnumSchema;

  const isEnum = !!enumItems;

  if (isEnum) {
    return;
  }

  const objectSchema = jsonSchema as ObjectSchema;

  const hasProperties = !!objectSchema.properties;

  // Guard against malformed schemas without properties
  if (!hasProperties) {
    return;
  }

  const { properties: objectProperties } = objectSchema;

  for (const propertyName in objectProperties) {
    const property = objectProperties[propertyName];

    callback(propertyName, property, object);

    const value = object[propertyName];
    const isValueUndefined = isUndefined(value);

    if (isValueUndefined) {
      continue;
    }

    const { $ref: refSchemaId } = property as ReferencePropertySchema;

    const isReference = !isUndefined(refSchemaId);

    if (isReference) {
      const referenceSchema = got(schemasMap, refSchemaId, 'Schema "$PATH" not found');

      const isObjectValue = value && typeof value === 'object' && !Array.isArray(value);

      // Only recursively process if the value is an object (not null, undefined, or primitive)
      if (isObjectValue) {
        mapObjectProperties(value as TargetObject, referenceSchema, schemasMap, callback);
      }
      continue;
    }

    const { type } = property as ObjectPropertySchema | ArrayPropertySchema;

    const isObject = type === 'object';

    if (isObject) {
      const { properties = {} } = property as ObjectPropertySchema;

      const isObjectValue = value && typeof value === 'object' && !Array.isArray(value);

      // Only recursively process if the value is an object (not null, undefined, or primitive)
      if (isObjectValue) {
        const nestedJsonSchema = {
          id: `${objectSchema.id}.${propertyName}.properties`,
          properties
        };

        mapObjectProperties(value as TargetObject, nestedJsonSchema, schemasMap, callback);
      }
      continue;
    }

    const isArray = type === 'array';

    if (isArray) {
      const { items } = property as ArrayPropertySchema;

      const hasItems = !!items;
      const isArrayValue = Array.isArray(value);

      // Only process if value is an array and items schema is defined
      if (isArrayValue && hasItems) {
        const { $ref: itemRefSchemaId } = items as ReferencePropertySchema;

        const { properties: itemObjectProperties = {} } = items as ObjectPropertySchema;

        const isItemReference = !isUndefined(itemRefSchemaId);

        const itemSchema = isItemReference
          ? got(schemasMap, itemRefSchemaId, 'Schema "$PATH" not found')
          : {
            id: `${objectSchema.id}.${propertyName}.items.properties`,
            properties: itemObjectProperties
          };

        for (const valueItem of value) {
          const isObjectItem = valueItem && typeof valueItem === 'object' && !Array.isArray(valueItem);

          // Only recursively process if the item is an object (not null, undefined, or primitive)
          if (isObjectItem) {
            mapObjectProperties(valueItem as TargetObject, itemSchema, schemasMap, callback);
          }
        }
      }
    }
  }
};

export default mapObjectProperties;
