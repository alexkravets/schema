import { isObject, cloneDeep } from 'lodash';

import { type TargetObject } from './JsonSchema';

const { isArray } = Array;

/** Drops null object properties */
const cleanupNulls = (target: TargetObject) => {
  const shouldSkip = !isObject(target);

  if (shouldSkip) {
    return;
  }

  for (const key in target) {
    const value = target[key];

    if (isArray(value)) {
      for (const item of value) {
        cleanupNulls(item);
      }

      continue;
    }

    if (isObject(value)) {
      cleanupNulls(value as Record<string, unknown>);

      continue;
    }

    const isNull = value === null;

    if (isNull) {
      delete target[key];
    }
  }
};

/** Returns an copy of the object without null properties */
export default function (object: Record<string, unknown>) {
  const clone = cloneDeep(object);

  cleanupNulls(clone);

  return clone;
};
