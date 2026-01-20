import type {
  JsonSchema,
  ObjectSchema,
  ArrayPropertySchema,
  ObjectPropertySchema,
  ReferencePropertySchema,
} from './JsonSchema';

/** Updates JSON schema with lists of required attributes based on required attributes of properties */
const normalizeRequired = (jsonSchema: JsonSchema | ObjectPropertySchema | ReferencePropertySchema) => {
  const { properties } = (jsonSchema as ObjectSchema);

  if (!properties) {
    return;
  }

  const required = [];

  for (const fieldName in properties) {
    const propertySchema = properties[fieldName];

    if (propertySchema.required) {
      propertySchema['x-required'] = true;
      required.push(fieldName);
    }

    delete properties[fieldName].required;

    const { type } = (propertySchema as ObjectPropertySchema | ArrayPropertySchema);

    const isObject = type === 'object';

    if (isObject) {
      normalizeRequired(propertySchema as ObjectPropertySchema);
      continue;
    }

    const isArray = type === 'array';

    if (isArray) {
      const { items: itemSchema } = (propertySchema as ArrayPropertySchema);

      normalizeRequired(itemSchema as ObjectPropertySchema | ReferencePropertySchema);
      continue;
    }
  }

  if (required.length > 0) {
    (jsonSchema as ObjectSchema).required = required;
  }
};

export default normalizeRequired;
