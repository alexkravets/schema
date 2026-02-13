import { isUndefined } from 'lodash';

/**
 * Normalizes required field declarations in JSON schemas by converting property-level
 * `required` flags to schema-level `required` arrays and `x-required` metadata flags.
 */
const normalizeRequired = (jsonSchema: EnumSchema | ObjectSchema | ObjectPropertySchema | ReferencePropertySchema) => {
  const { enum: enumItems } = (jsonSchema as EnumSchema);

  const isEnum = !!enumItems;

  if (isEnum) {
    return;
  }

  const objectSchema = (jsonSchema as ObjectSchema);
  const { properties } = objectSchema;

  if (!properties) {
    return;
  }

  const required = [];

  for (const propertyName in properties) {
    const property = properties[propertyName];

    const { $ref: refSchemaId } = (property as ReferencePropertySchema);

    const isReference = !isUndefined(refSchemaId);

    // Handle required flag for all properties (including references)
    if (property.required) {
      property['x-required'] = true;
      required.push(propertyName);
    }

    // Delete required property for all properties (whether true or false)
    delete property.required;

    // Skip recursive processing for reference properties
    if (isReference) {
      continue;
    }

    const { type } = (property as ObjectPropertySchema | ArrayPropertySchema);

    const isObject = type === 'object';

    if (isObject) {
      normalizeRequired(property as ObjectPropertySchema);
      continue;
    }

    const isArray = type === 'array';

    if (isArray) {
      const { items } = (property as ArrayPropertySchema);

      if (items) {
        normalizeRequired(items as ObjectPropertySchema | ReferencePropertySchema);
      }

      continue;
    }
  }

  if (required.length > 0) {
    objectSchema.required = required;
  }
};

export default normalizeRequired;
