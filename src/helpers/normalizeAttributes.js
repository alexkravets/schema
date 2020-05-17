'use strict'

const mapObject     = require('./mapObject')
const isUndefined   = require('lodash.isundefined')
const normalizeType = require('./normalizeType')

const normalizeAttributes = (object, jsonSchema, jsonSchemasMap) => {
  const callback = (propertyName, propertySchema, object) => {
    const value = object[propertyName]

    const { type, default: defaultValue } = propertySchema

    const hasDefaultValue = !isUndefined(defaultValue)
    const isValueDefined  = !isUndefined(value)

    if (hasDefaultValue && !isValueDefined) {
      object[propertyName] = defaultValue
    }

    if (type && isValueDefined) {
      object[propertyName] = normalizeType(type, value)
    }
  }

  mapObject(object, jsonSchema, jsonSchemasMap, callback)
}

module.exports = normalizeAttributes
