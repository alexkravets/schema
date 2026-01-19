import { isUndefined } from 'lodash';
import got from './got';

type Target = Record<string, unknown>;

type ReferencePropertySchema = {
  $ref: string;
};

type EnumSchema = {
  enum: string[];
};

type ObjectPropertySchema = {
  type: 'object';
  properties: PropertiesSchema;
}

type ArrayPropertySchema = {
  type: 'array';
  items: ReferencePropertySchema | ObjectPropertySchema;
};

type PropertiesSchema = Record<string, ReferencePropertySchema | ObjectPropertySchema | ArrayPropertySchema>;

type ObjectSchema = {
  id: string;
  properties: PropertiesSchema;
};

type JsonSchema = EnumSchema | ObjectSchema;

/** Ensure target project properties are defined in schema, drops those that are not defined */
const cleanupAttributes = (object: Target, jsonSchema: JsonSchema, schemasMap: Record<string, JsonSchema> = {}) => {
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

      cleanupAttributes(object[fieldName] as Target, referenceSchema, schemasMap);
      continue;
    }

    const { type } = (property as ObjectPropertySchema | ArrayPropertySchema);

    const isObject = type === 'object';

    if (isObject) {
      const { properties } = (property as ObjectPropertySchema);

      const nestedJsonSchema = {
        id: `${objectSchema.id}.${fieldName}.properties`,
        properties
      };

      cleanupAttributes(object[fieldName] as Target, nestedJsonSchema, schemasMap);
      continue;
    }

    const isArray = type === 'array';

    if (isArray) {
      const { items } = (property as ArrayPropertySchema);

      const { $ref: itemRefSchemaId } = (items as ReferencePropertySchema);

      const { properties: itemObjectProperties } = (items as ObjectPropertySchema);

      const isItemReference = !!itemRefSchemaId;

      const itemSchema = isItemReference
        ? got(schemasMap, itemRefSchemaId)
        : {
          id: `${objectSchema.id}.${fieldName}.item`,
          properties: itemObjectProperties
        };

      for (const item of object[fieldName] as Target[]) {
        cleanupAttributes(item, itemSchema, schemasMap);
      }
    }
  }
};

export default cleanupAttributes;
