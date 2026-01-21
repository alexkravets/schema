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

/** Ensure target project properties are defined in schema, drops those that are not defined */
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
      const referenceSchema = got(schemasMap, refSchemaId);

      cleanupAttributes(object[fieldName] as TargetObject, referenceSchema, schemasMap);
      continue;
    }

    const { type } = (property as ObjectPropertySchema | ArrayPropertySchema);

    const isObject = type === 'object';

    if (isObject) {
      const { properties = {} } = (property as ObjectPropertySchema);

      const nestedJsonSchema = {
        id: `${objectSchema.id}.${fieldName}.properties`,
        properties
      };

      cleanupAttributes(object[fieldName] as TargetObject, nestedJsonSchema, schemasMap);
      continue;
    }

    const isArray = type === 'array';

    if (isArray) {
      const { items } = (property as ArrayPropertySchema);

      const { $ref: itemRefSchemaId } = (items as ReferencePropertySchema);

      const { properties: itemObjectProperties = {} } = (items as ObjectPropertySchema);

      const isItemReference = !!itemRefSchemaId;

      const itemSchema = isItemReference
        ? got(schemasMap, itemRefSchemaId)
        : {
          id: `${objectSchema.id}.${fieldName}.items.properties`,
          properties: itemObjectProperties
        };

      for (const item of object[fieldName] as TargetObject[]) {
        cleanupAttributes(item, itemSchema, schemasMap);
      }
    }
  }
};

export default cleanupAttributes;
