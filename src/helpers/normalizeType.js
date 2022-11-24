'use strict'

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
        const isTrue = value.toLowerCase() === 'true' || value === '1'
        normalizedValue = isTrue ? true : false
      }
    }
  }

  return normalizedValue
}

module.exports = normalizeType
