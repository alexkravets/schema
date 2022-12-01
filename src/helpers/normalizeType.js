'use strict'

const BOOLEAN_STRING_TRUE_VALUES = ['yes', 'true', '1']
const BOOLEAN_STRING_FALSE_VALUES = ['no', 'false', '0']

const normalizeType = (type, value) => {
  let normalizedValue = value

  const isNumber  = type === 'integer' || type === 'number'
  const isBoolean = type === 'boolean'

  if (isNumber) {
    normalizedValue = Number(value) || value
  }

  if (isBoolean) {
    const isNumberValue  = typeof value === 'number'
    const isStringValue  = typeof value === 'string'

    const shouldConvertValue = isNumberValue || isStringValue

    if (shouldConvertValue) {
      if (isNumberValue) {
        normalizedValue = Boolean(value)
      }

      if (isStringValue) {
        const isTrue = BOOLEAN_STRING_TRUE_VALUES.includes(value.toLowerCase())
        const isFalse = BOOLEAN_STRING_FALSE_VALUES.includes(value.toLowerCase())

        if (isTrue || isFalse) {
          normalizedValue = isTrue ? true : false
        }
      }
    }
  }

  return normalizedValue
}

module.exports = normalizeType
