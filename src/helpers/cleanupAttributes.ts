import { isUndefined } from 'lodash';
import { type JsonSchema } from 'z-schema';

import got from './got';

/** Removes properties from an object that are not defined in the JSON schema. */
const cleanupAttributes = (
  object: TargetObject,
  jsonSchema: JsonSchema,
  schemasMap: Record<string, JsonSchema> = {}
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
        } as JsonSchema;

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
          } as JsonSchema;

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
