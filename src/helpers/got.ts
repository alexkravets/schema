import { get, isUndefined } from 'lodash';

const DEFAULT_ERROR_TEMPLATE = 'Value is undefined for "$PATH"';

/** Throws an error if objects property is undefined */
function got<T>(object: Record<string, T>, path: string, errorTemplate: string = DEFAULT_ERROR_TEMPLATE): T {
  const value = get(object, path);
  const shouldThrow = isUndefined(value);

  if (!shouldThrow) {
    return value;
  }

  throw Error(errorTemplate.replace('$PATH', path));
};

export default got;
