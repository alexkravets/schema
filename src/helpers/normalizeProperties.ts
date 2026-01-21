import { get, set, isUndefined } from 'lodash';

import type {
  EnumSchema,
  PropertiesSchema,
  ObjectPropertySchema,
  ReferencePropertySchema,
  ArrayPropertySchema
} from './JsonSchema';

/** Ensures type attribute is set for schema properties */
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

      normalizeProperties((property as ObjectPropertySchema).properties || {});
    }

    const isArray = type === 'array';

    if (isArray) {
      if (hasItems) {
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
