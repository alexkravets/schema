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

/** Applies callback method to each object property including nexted objects and arrays */
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

  const objectSchema = (jsonSchema as ObjectSchema);
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
      const referenceSchema = got(schemasMap, refSchemaId);

      mapObjectProperties(value as TargetObject, referenceSchema, schemasMap, callback);
      continue;
    }

    const { type } = (property as ObjectPropertySchema | ArrayPropertySchema);

    const isObject = type === 'object';

    if (isObject) {
      const { properties = {} } = (property as ObjectPropertySchema);

      const nestedJsonSchema = {
        id: `${objectSchema.id}.${propertyName}.properties`,
        properties
      };

      mapObjectProperties(value as TargetObject, nestedJsonSchema, schemasMap, callback);
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
          id: `${objectSchema.id}.${propertyName}.items.properties`,
          properties: itemObjectProperties
        };

      for (const valueItem of value as TargetObject[]) {
        mapObjectProperties(valueItem, itemSchema, schemasMap, callback);
      }
    }
  }
};

export default mapObjectProperties;
