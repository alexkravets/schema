'use strict'

const normalizeType = (type, value) => {
  let normalizedValue = value

  const isNumber  = type === 'integer' || type === 'number'
  const isBoolean = type === 'boolean'

  if (isNumber) {
    normalizedValue = Number(value) || value
  }

  if (isBoolean) {
    const isBoolean = typeof value === 'boolean'
    const isNumber  = typeof value === 'number'

    if (!isBoolean) {
      if (isNumber) {
        normalizedValue = Boolean(value)

      } else {
        const isTrue = value.toLowerCase() === 'true' || value === '1'
        normalizedValue = isTrue ? true : false

      }
    }
  }

  return normalizedValue
}

module.exports = normalizeType
