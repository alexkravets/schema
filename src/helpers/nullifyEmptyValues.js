'use strict'

const { get, set } = require('lodash')
const { schemaSymbol, jsonSymbol } = require('z-schema')

const FORMAT_ERROR_CODES = [
  'PATTERN',
  'ENUM_MISMATCH',
  'INVALID_FORMAT'
]

const EMPTY_VALUES = [
  '',
]

const nullifyEmptyValues = (object, validationErrors) => {
  const objectJson = JSON.stringify(object)
  const result = JSON.parse(objectJson)

  const otherValidationErrors = []

  for (const error of validationErrors) {
    const { code } = error

    const isAttributeRequired = error[schemaSymbol]['x-required'] === true
    const isFormatError = FORMAT_ERROR_CODES.includes(code)

    if (isAttributeRequired) {
      otherValidationErrors.push(error)
      continue
    }

    if (!isFormatError) {
      otherValidationErrors.push(error)
      continue
    }

    const { path: pathString } = error
    const path = pathString.replace('#/', '').split('/')

    const json = error[jsonSymbol]
    const value = get(json, path)

    const isEmptyValue = EMPTY_VALUES.includes(value)

    if (!isEmptyValue) {
      otherValidationErrors.push(error)
      continue
    }

    set(result, path, null)
  }

  return [ result, otherValidationErrors ]
}

module.exports = nullifyEmptyValues
