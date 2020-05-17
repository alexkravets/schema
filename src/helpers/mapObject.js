'use strict'

const isUndefined = require('lodash.isundefined')

const mapObject = (object, jsonSchema, schemasMap, callback) => {
  const { id, enum: isEnum } = jsonSchema

  if (isEnum) { return }

  for (const propertyName in jsonSchema.properties) {
    const property = jsonSchema.properties[propertyName]

    callback(propertyName, property, object)

    const { $ref: refSchemaId, properties, items } = property

    const value          = object[propertyName]
    const isArray        = property.type === 'array'
    const isObject       = property.type === 'object'
    const isReference    = !isUndefined(refSchemaId)
    const isValueDefined = !isUndefined(value)

    if (isValueDefined) {
      if (isReference) {
        const refJsonSchema = schemasMap[refSchemaId]

        mapObject(value, refJsonSchema, schemasMap, callback)

      } else if (isObject) {
        const nestedJsonSchema = {
          id:   `${id}.${propertyName}.properties`,
          type: 'object',
          properties
        }

        mapObject(value, nestedJsonSchema, schemasMap, callback)

      } else if (isArray) {
        const itemProperties  = items.properties
        const itemRefSchemaId = items.$ref

        let itemJsonSchema

        if (itemRefSchemaId) {
          itemJsonSchema = schemasMap[itemRefSchemaId]

        } else if (itemProperties) {
          itemJsonSchema = {
            id:         `${id}.${propertyName}.items.properties`,
            type:       'object',
            properties: itemProperties
          }
        }

        if (itemJsonSchema) {
          for (const valueItem of value) {
            mapObject(valueItem, itemJsonSchema, schemasMap, callback)
          }
        }
      }
    }
  }
}

module.exports = mapObject
