import { isUndefined } from 'lodash';

import got from './got';
import type {
  JsonSchema,
  EnumSchema,
  TargetObject,
  ObjectSchema,
  JsonSchemasMap,
  ArrayPropertySchema,
  ObjectPropertySchema,
  ReferencePropertySchema
} from './JsonSchema';

/**
 * Removes properties from an object that are not defined in the JSON schema.
 *
 * **Intent:**
 * This function ensures that objects conform to their schema definition by removing
 * any properties that are not explicitly defined in the schema. It performs a deep
 * cleanup, recursively processing nested objects, arrays, and schema references.
 *
 * **Use Cases:**
 * - **Third-party API integrations**: When integrating with external services (e.g., Telegram)
 *   that may send additional fields you don't want to process, this function allows you
 *   to define a minimal schema and automatically strip unwanted properties.
 * - **Data sanitization**: Clean up objects received from external sources or user input
 *   before validation or processing, ensuring only expected fields are present.
 * - **Schema enforcement**: Enforce strict schema compliance by removing any properties
 *   that don't match the defined schema structure.
 * - **Pre-validation cleanup**: Remove extraneous properties before schema validation to
 *   prevent validation errors from unexpected fields.
 *
 * **Behavior:**
 * - Mutates the input object in-place (does not return a new object)
 * - Recursively processes nested objects, arrays, and schema references ($ref)
 * - Skips enum schemas (returns early without modification)
 * - Only processes object values (skips null, undefined, and primitive values)
 * - Handles array items by cleaning each object item according to the array's item schema
 *
 * @param object - The target object to clean up (mutated in-place)
 * @param jsonSchema - The JSON schema defining allowed properties
 * @param schemasMap - Optional map of schema IDs to schema definitions for resolving $ref references
 */
const cleanupAttributes = (
  object: TargetObject,
  jsonSchema: JsonSchema,
  schemasMap: JsonSchemasMap = {}
) => {
  const { enum: enumItems } = (jsonSchema as EnumSchema);

  const isEnum = !!enumItems;

  if (isEnum) {
    return;
  }

  const objectSchema = (jsonSchema as ObjectSchema);

  // Guard against malformed schemas without properties
  if (!objectSchema.properties) {
    return;
  }

  for (const fieldName in object) {
    const property = objectSchema.properties[fieldName];

    const isPropertyUndefined = isUndefined(property);

    if (isPropertyUndefined) {
      // NOTE: Delete object property if it's not defined in the object schema:
      delete object[fieldName];
      continue;
    }

    const { $ref: refSchemaId } = (property as ReferencePropertySchema);

    const isReference = !isUndefined(refSchemaId);

    if (isReference) {
      const referenceSchema = got(schemasMap, refSchemaId, 'Schema "$PATH" not found');
      const fieldValue = object[fieldName];

      // Only recursively cleanup if the value is an object (not null, undefined, or primitive)
      if (fieldValue && typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
        cleanupAttributes(fieldValue as TargetObject, referenceSchema, schemasMap);
      }
      continue;
    }

    const { type } = (property as ObjectPropertySchema | ArrayPropertySchema);

    const isObject = type === 'object';

    if (isObject) {
      const { properties = {} } = (property as ObjectPropertySchema);

      const fieldValue = object[fieldName];

      const isObjectValue = fieldValue &&
        typeof fieldValue === 'object' &&
        !Array.isArray(fieldValue);

      if (isObjectValue) {
        const nestedJsonSchema = {
          id: `${objectSchema.id}.${fieldName}.properties`,
          properties
        };

        cleanupAttributes(fieldValue as TargetObject, nestedJsonSchema, schemasMap);
      }
      continue;
    }

    const isArray = type === 'array';

    if (isArray) {
      const { items } = (property as ArrayPropertySchema);

      const fieldValue = object[fieldName];
      const isArrayValue = Array.isArray(fieldValue);

      if (isArrayValue && items) {
        const { $ref: itemRefSchemaId } = (items as ReferencePropertySchema);

        const { properties: itemObjectProperties = {} } = (items as ObjectPropertySchema);

        const isItemReference = !isUndefined(itemRefSchemaId);

        const itemSchema = isItemReference
          ? got(schemasMap, itemRefSchemaId, 'Schema "$PATH" not found')
          : {
            id: `${objectSchema.id}.${fieldName}.items.properties`,
            properties: itemObjectProperties
          };

        for (const item of fieldValue) {
          const isObjectItem = item &&
            typeof item === 'object' &&
            !Array.isArray(item);

          if (isObjectItem) {
            cleanupAttributes(item as TargetObject, itemSchema, schemasMap);
          }
        }
      }
    }
  }
};

export default cleanupAttributes;
