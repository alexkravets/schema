import { get, isUndefined } from 'lodash';

import normalizeType from './normalizeType';
import mapObjectProperties from './mapObjectProperties';
import type { TargetObject, JsonSchema, JsonSchemasMap, PropertySchema } from './JsonSchema';

/** Normalize object attributes values based on it's schema */
const normalizeAttributes = (object: TargetObject, jsonSchema: JsonSchema, jsonSchemasMap: JsonSchemasMap) => {
  /** Callback to normalize value based on property type defined in schema */
  const callback = (propertyName: string, propertySchema: PropertySchema, object: TargetObject) => {
    const value = object[propertyName];

    const type = get(propertySchema, 'type');
    const defaultValue = get(propertySchema, 'default');

    const hasValue = !isUndefined(value);
    const hasDefaultValue = !isUndefined(defaultValue);

    const shouldSetDefaultValue = hasDefaultValue && !hasValue;

    if (shouldSetDefaultValue) {
      object[propertyName] = defaultValue;
    }

    const shouldNormalizeValue = !!type && hasValue;

    if (shouldNormalizeValue) {
      object[propertyName] = normalizeType(type, value);
    }
  };

  mapObjectProperties(object, jsonSchema, jsonSchemasMap, callback);
};

export default normalizeAttributes;
