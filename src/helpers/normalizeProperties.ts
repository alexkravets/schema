import { get, set, isUndefined } from 'lodash';

/** Normalizes JSON schema properties by ensuring all properties have an explicit `type` attribute. */
const normalizeProperties = (schema: EnumSchema | PropertiesSchema) => {
  const { enum: isEnum } = (schema as EnumSchema);

  if (isEnum) {
    const enumSchema = (schema as EnumSchema);
    enumSchema.type = enumSchema.type || 'string';

    return;
  }

  const properties = (schema as PropertiesSchema);

  for (const name in properties) {
    const property = properties[name];

    const { $ref: isRef } = (property as ReferencePropertySchema);

    if (isRef) {
      continue;
    }

    const hasType = !!get(property, 'type');
    const hasItems = !!get(property, 'items');
    const hasProperties = !!get(property, 'properties');

    if (!hasType) {
      if (hasProperties) {
        set(property, 'type', 'object');

      } else if (hasItems) {
        set(property, 'type', 'array');

      } else {
        set(property, 'type', 'string');

      }
    }

    const type = get(property, 'type');

    const isObject = type === 'object';

    if (isObject) {
      if (!hasProperties) {
        (property as ObjectPropertySchema).properties = {};
      }

      // istanbul ignore next - unreachable defensive code: properties is always set to {} above if missing
      normalizeProperties((property as ObjectPropertySchema).properties || {});
    }

    const isArray = type === 'array';

    if (isArray) {
      if (hasItems) {
        // istanbul ignore next - unreachable defensive code: if items is undefined, hasItems would be false
        const { items = {} } = (property as ArrayPropertySchema);

        const isItemObject = !isUndefined((items as ObjectPropertySchema).properties);

        if (isItemObject) {
          set(items, 'type', 'object');

          normalizeProperties((items as ObjectPropertySchema).properties || {});
        }

      } else {
        (property as ArrayPropertySchema).items = { type: 'string' };

      }
    }
  }
};

export default normalizeProperties;
