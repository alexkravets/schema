import { isObject, cloneDeep } from 'lodash';

const { isArray } = Array;

/** Recursively removes null properties from an object. */
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

/** Returns a deep copy of the object with all null properties removed. */
export default function (object: Record<string, unknown>) {
  const clone = cloneDeep(object);

  cleanupNulls(clone);

  return clone;
};
