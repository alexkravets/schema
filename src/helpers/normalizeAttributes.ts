import { type JsonSchema } from 'z-schema';
import { get, isUndefined } from 'lodash';

import normalizeType from './normalizeType';
import mapObjectProperties from './mapObjectProperties';

/** Normalizes object attribute values based on a JSON Schema definition. */
const normalizeAttributes = (
  object: TargetObject,
  jsonSchema: JsonSchema,
  jsonSchemasMap: Record<string, JsonSchema>
) => {
  /** Callback to normalize value based on property type defined in schema */
  const callback = (propertyName: string, propertySchema: PropertySchema, object: TargetObject) => {
    let value = object[propertyName];

    const type = get(propertySchema, 'type');
    const defaultValue = get(propertySchema, 'default');

    const hasValue = !isUndefined(value);
    const hasDefaultValue = !isUndefined(defaultValue);
    const shouldSetDefaultValue = hasDefaultValue && !hasValue;

    // Set default value if property is undefined and default exists
    if (shouldSetDefaultValue) {
      object[propertyName] = defaultValue;
      value = defaultValue; // Update value reference for normalization
    }

    const hasType = !!type;
    const hasValueAfterDefault = !isUndefined(value);
    const shouldNormalizeValue = hasType && hasValueAfterDefault;

    // Normalize the current value (original or default) if type is defined
    if (shouldNormalizeValue) {
      object[propertyName] = normalizeType(type, value);
    }
  };

  mapObjectProperties(object, jsonSchema, jsonSchemasMap, callback);
};

export default normalizeAttributes;
