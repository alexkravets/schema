
/** Recursively removes `required` and `default` attributes from a JSON schema. */
const removeRequiredAndDefault = (jsonSchema: PropertySchema | EnumSchema) => {
  const { properties } = (jsonSchema as ObjectPropertySchema);

  if (!properties) {
    return { properties: {} };
  }

  for (const fieldName in properties) {
    const property = properties[fieldName];

    // Remove required and default from the property itself
    delete property.required;
    delete property.default;

    // Check if property has a type to determine how to process it
    const { type } = (property as ObjectPropertySchema | ArrayPropertySchema);

    const isObject = type === 'object';
    const isArray = type === 'array';

    if (isObject) {
      // Recursively process nested object properties
      removeRequiredAndDefault(property as ObjectPropertySchema);
      continue;
    }

    if (isArray) {
      const { items } = (property as ArrayPropertySchema);
      if (items) {
        // Recursively process array items
        // Note: For EnumSchema/ReferencePropertySchema items without properties,
        // this will return { properties: {} } but the items themselves are not
        // modified (only properties within objects are processed)
        removeRequiredAndDefault(items);
      }
    }
    // For other types (string, number, boolean, etc.) or properties without type,
    // no further processing is needed
  }

  return { properties };
};

export default removeRequiredAndDefault;
