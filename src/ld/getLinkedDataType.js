'use strict'

// TODO: Add support for all types and formats, extend schema library with
//       support for additional formats, e.g. URL, Duration etc.
const getLinkedDataType = schema => {
  const isOverriden = !!schema['@type']

  if (isOverriden) {
    return schema['@type']
  }

  const { type, format } = schema

  const isDate     = format === 'date'
  const isNumber   = type === 'number'
  const isInteger  = type === 'integer'
  const isDateTime = format === 'date-time'

  if (isInteger) {
    return 'schema:Integer'
  }

  if (isNumber) {
    return 'schema:Number'
  }

  if (isDate) {
    return 'schema:Date'
  }

  if (isDateTime) {
    return 'schema:DateTime'
  }

  return
}

module.exports = getLinkedDataType
