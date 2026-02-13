import { isUndefined } from 'lodash';
import { type JsonSchema } from 'z-schema';

import got from './got';

/**
 * Recursively traverses an object's properties based on a JSON schema and applies a callback
 * function to each property. Handles nested objects, arrays, and schema references ($ref).
 */
const mapObjectProperties = (
  object: TargetObject,
  jsonSchema: JsonSchema,
  schemasMap: Record<string, JsonSchema>,
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
        } as JsonSchema;

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
          }  as JsonSchema;;

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
