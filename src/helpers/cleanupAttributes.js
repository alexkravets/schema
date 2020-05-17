'use strict'

const isUndefined = require('lodash.isundefined')

const cleanupAttributes = (object, jsonSchema, schemasMap) => {
  const { id, enum: isEnum } = jsonSchema

  if (isEnum) { return }


  for (const fieldName in object) {
    const property = jsonSchema.properties[fieldName]
    const isPropertyUndefined = isUndefined(property)

    if (isPropertyUndefined) {
      delete object[fieldName]

    } else {
      const { $ref: refSchemaId, properties, type } = property

      const isArray     = type === 'array'
      const isObject    = type === 'object'
      const isReference = !isUndefined(refSchemaId)

      if (isReference) {
        const refJsonSchema = schemasMap[refSchemaId]

        cleanupAttributes(object[fieldName], refJsonSchema, schemasMap)

      } else if (isObject) {
        const nestedJsonSchema = {
          id:   `${id}.${fieldName}.properties`,
          type: 'object',
          properties
        }

        cleanupAttributes(object[fieldName], nestedJsonSchema, schemasMap)

      } else if (isArray) {
        const { items } = property
        const { $ref: itemRefSchemaId, properties: itemProperties } = items

        const array = object[fieldName]
        const isItemObject    = !!itemProperties
        const isItemReference = !!itemRefSchemaId

        let itemJsonSchema

        if (isItemReference) {
          itemJsonSchema = schemasMap[itemRefSchemaId]

        } else if (isItemObject) {
          itemJsonSchema = {
            id:         `${id}.${fieldName}.item`,
            type:       'object',
            properties: itemProperties
          }

        }

        if (itemJsonSchema) {
          for (const item of array) {
            cleanupAttributes(item, itemJsonSchema, schemasMap)
          }
        }
      }
    }
  }
}

module.exports = cleanupAttributes
