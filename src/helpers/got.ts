import { get, isUndefined } from 'lodash';

const DEFAULT_ERROR_TEMPLATE = 'Value is undefined for "$PATH"';

/** Safe required property access: returns a value at `path` or throws if it is `undefined`. */
function got<T>(object: T, path: string, errorTemplate: string = DEFAULT_ERROR_TEMPLATE): T[keyof T]{
  const value = get(object, path) as T[keyof T];
  const shouldThrow = isUndefined(value);

  if (!shouldThrow) {
    return value;
  }

  throw Error(errorTemplate.replace('$PATH', path));
};

export default got;
