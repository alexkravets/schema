import { isUndefined, uniq } from 'lodash';

import Schema from '../Schema';
import got from './got';
import {
  EnumSchema,
  ObjectSchema,
  ArrayPropertySchema,
  ObjectPropertySchema,
  ReferencePropertySchema,
} from './JsonSchema';

/** Returns referenced schema IDs for the schema */
const getReferenceIds = (schema: Schema, schemasMap: Record<string, Schema>): string[] => {
  /** Returns schema from the map by ID */
  const getSchema = (id: string) => got(schemasMap, id);

  let referenceIds: string[] = [];

  const { jsonSchema } = schema;
  const { enum: isEnum } = (jsonSchema as EnumSchema);

  if (isEnum) {
    return [];
  }

  const objectSchema = (jsonSchema as ObjectSchema);

  for (const propertyName in objectSchema.properties) {
    const property = objectSchema.properties[propertyName];

    const { $ref: refSchemaId } = (property as ReferencePropertySchema);

    const isReference = !isUndefined(refSchemaId);

    if (isReference) {
      const refJsonSchema = getSchema(refSchemaId);
      const nestedReferenceIds = getReferenceIds(refJsonSchema, schemasMap);

      referenceIds = [
        refSchemaId,
        ...referenceIds,
        ...nestedReferenceIds
      ];

      continue;
    }

    const { type } = (property as ArrayPropertySchema | ObjectPropertySchema);

    const isObject = type === 'object';

    if (isObject) {
      const { properties = {} } = (property as ObjectPropertySchema);

      const nestedSchema = new Schema(properties, `${objectSchema.id}.${propertyName}.properties`);
      const nestedReferenceIds = getReferenceIds(nestedSchema, schemasMap);

      referenceIds = [
        ...referenceIds,
        ...nestedReferenceIds
      ];

      continue;
    }

    const isArray = type === 'array';

    if (!isArray) {
      continue;
    }

    const { items } = (property as ArrayPropertySchema);


    let itemJsonSchema;

    const itemRefSchemaId = (items as ReferencePropertySchema).$ref;

    if (itemRefSchemaId) {
      itemJsonSchema = getSchema(itemRefSchemaId);
      const nestedReferenceIds = getReferenceIds(itemJsonSchema, schemasMap);

      referenceIds = [
        itemRefSchemaId,
        ...referenceIds,
        ...nestedReferenceIds
      ];

      continue;
    }

    const itemProperties = (items as ObjectPropertySchema).properties;

    if (itemProperties) {
      const itemSchema = new Schema(itemProperties, `${objectSchema.id}.${propertyName}.items.properties`);
      const itemReferenceIds = getReferenceIds(itemSchema, schemasMap);

      referenceIds = [
        ...referenceIds,
        ...itemReferenceIds
      ];

      continue;
    }
  }

  return uniq(referenceIds);
};

export default getReferenceIds;
