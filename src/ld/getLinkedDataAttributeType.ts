import { get } from 'lodash';

export type PropertySchema = {
  '@type'?: string;
  $ref?: string;
  type?: string;
  format?: string;
};

/** Returns linked data attribute type for a property schema, unless @type is defined */
const getLinkedDataAttributeType = (propertySchema: PropertySchema): string | undefined => {
  const isOverriden = !!get(propertySchema, '@type');

  if (isOverriden) {
    return get(propertySchema, '@type');
  }

  // TODO: Add support for all types and formats, extend schema library with
  //       support for additional formats, e.g. URL, Duration etc.
  const { type, format } = propertySchema;

  const isDate = format === 'date';
  const isNumber = type === 'number';
  const isInteger = type === 'integer';
  const isDateTime = format === 'date-time';

  if (isInteger) {
    return 'schema:Integer';
  }

  if (isNumber) {
    return 'schema:Number';
  }

  if (isDate) {
    return 'schema:Date';
  }

  if (isDateTime) {
    return 'schema:DateTime';
  }

  return;
};

export default getLinkedDataAttributeType;
