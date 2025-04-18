'use strict'

const { isArray } = Array
const { isObject, cloneDeep } = require('lodash')

const cleanupNulls = object => {
  if (!isObject(object)) {
    return
  }

  for (const key in object) {
    const value = object[key]

    if (isArray(value)) {
      for (const item of value) {
        cleanupNulls(item)
      }

      continue
    }

    if (isObject(value)) {
      cleanupNulls(value)

      continue
    }

    const isNull = value === null

    if (isNull) {
      delete object[key]
    }
  }
}

module.exports = input => {
  const object = cloneDeep(input)

  cleanupNulls(object)

  return object
}
