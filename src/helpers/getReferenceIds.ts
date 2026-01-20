import { isUndefined, uniq } from 'lodash';
import Schema from '../Schema';
import got from './got';
import { EnumSchema, ObjectSchema } from './JsonSchema';

/** */
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

    const { $ref: refSchemaId, properties, items } = property;

    const isArray = property.type === 'array';
    const isObject = property.type === 'object';

    const isReference = !isUndefined(refSchemaId);

    if (isReference) {
      const refJsonSchema = getSchema(refSchemaId, `${objectSchema.id}.${propertyName}.$ref`);
      const nestedReferenceIds = getReferenceIds(refJsonSchema, schemasMap);

      referenceIds = [ ...referenceIds, refSchemaId, ...nestedReferenceIds ];
      continue;

    }

    if (isObject) {
      const nestedSchema       = new Schema(properties, `${objectSchema.id}.${propertyName}.properties`);
      const nestedReferenceIds = getReferenceIds(nestedSchema, schemasMap);

      referenceIds = [ ...referenceIds, ...nestedReferenceIds ];
      continue;
    }

    if (!isArray) {
      continue;
    }

    const itemProperties  = items.properties;
    const itemRefSchemaId = items.$ref;

    let itemJsonSchema;

    if (itemRefSchemaId) {
      itemJsonSchema = getSchema(itemRefSchemaId, `${objectSchema.id}.${propertyName}.items.$ref`);
      const nestedReferenceIds = getReferenceIds(itemJsonSchema, schemasMap);

      referenceIds = [ ...referenceIds, itemRefSchemaId, ...nestedReferenceIds ];
      continue;
    }

    if (itemProperties) {
      const itemSchema = new Schema(itemProperties, `${id}.${propertyName}.items.properties`);
      const itemReferenceIds = getReferenceIds(itemSchema, schemasMap);

      referenceIds = [ ...referenceIds, ...itemReferenceIds ];
      continue;
    }
  }

  return uniq(referenceIds);
};

export default getReferenceIds;
