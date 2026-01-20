import { get, set } from 'lodash';
import type { TargetObject } from './JsonSchema';
import { schemaSymbol, jsonSymbol, type SchemaErrorDetail } from 'z-schema';

const FORMAT_ERROR_CODES = [
  'PATTERN',
  'ENUM_MISMATCH',
  'INVALID_FORMAT'
];

const EMPTY_STRING = '';

const EMPTY_VALUES = [
  EMPTY_STRING,
];

/** Replaces empty string attributes of the object with null */
const nullifyEmptyValues = (object: TargetObject, validationErrors: SchemaErrorDetail[]) => {
  const objectJson = JSON.stringify(object);
  const result = JSON.parse(objectJson);

  const otherValidationErrors = [];

  for (const error of validationErrors) {
    const { code } = error;

    const isAttributeRequired = get(error, schemaSymbol)['x-required'] === true;
    const isFormatError = FORMAT_ERROR_CODES.includes(code);

    if (isAttributeRequired) {
      otherValidationErrors.push(error);
      continue;
    }

    if (!isFormatError) {
      otherValidationErrors.push(error);
      continue;
    }

    const { path: pathString } = error;

    const path = pathString
      .replace('#/', '')
      .split('/');

    const json = get(error, jsonSymbol);
    const value = get(json, path);

    const isEmptyValue = EMPTY_VALUES.includes(value);

    if (!isEmptyValue) {
      otherValidationErrors.push(error);
      continue;
    }

    set(result, path, null);
  }

  return [ result, otherValidationErrors ];
};

export default nullifyEmptyValues;
