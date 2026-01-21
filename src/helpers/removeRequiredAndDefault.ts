import type {
  EnumSchema,
  PropertySchema,
  ArrayPropertySchema,
  ObjectPropertySchema,
} from './JsonSchema';

/** Removes required and default attributes of a JSON schema */
const removeRequiredAndDefault = (jsonSchema: PropertySchema | EnumSchema) => {
  const { properties } = (jsonSchema as ObjectPropertySchema);

  if (!properties) {
    return { properties: {} };
  }

  for (const fieldName in properties) {
    const property = properties[fieldName];

    delete property.required;
    delete property.default;

    const { type } = (property as ObjectPropertySchema | ArrayPropertySchema);

    const isObject = type === 'object';

    if (isObject) {
      removeRequiredAndDefault(property as ObjectPropertySchema);
      continue;
    }

    const isArray = type === 'array';

    if (isArray) {
      const { items = {} } = (property as ArrayPropertySchema);
      removeRequiredAndDefault(items);
    }
  }

  return { properties };
};

export default removeRequiredAndDefault;
