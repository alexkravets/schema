'use strict'

const { isUndefined, uniq } = require('lodash')
const Schema = require('../Schema')

const getReferenceIds = (schema, schemasMap) => {
  const getSchema = id => schemasMap[id]

  let referenceIds = []

  const { jsonSchema } = schema
  const { id, enum: isEnum } = jsonSchema

  if (isEnum) { return [] }

  for (const propertyName in jsonSchema.properties) {
    const property = jsonSchema.properties[propertyName]

    const { $ref: refSchemaId, properties, items } = property

    const isArray     = property.type === 'array'
    const isObject    = property.type === 'object'
    const isReference = !isUndefined(refSchemaId)

    if (isReference) {
      const refJsonSchema      = getSchema(refSchemaId, `${id}.${propertyName}.$ref`)
      const nestedReferenceIds = getReferenceIds(refJsonSchema, schemasMap)

      referenceIds = [ ...referenceIds, refSchemaId, ...nestedReferenceIds ]
      continue

    }

    if (isObject) {
      const nestedSchema       = new Schema(properties, `${id}.${propertyName}.properties`)
      const nestedReferenceIds = getReferenceIds(nestedSchema, schemasMap)

      referenceIds = [ ...referenceIds, ...nestedReferenceIds ]
      continue
    }

    if (!isArray) {
      continue
    }

    const itemProperties  = items.properties
    const itemRefSchemaId = items.$ref

    let itemJsonSchema

    if (itemRefSchemaId) {
      itemJsonSchema = getSchema(itemRefSchemaId, `${id}.${propertyName}.items.$ref`)
      const nestedReferenceIds = getReferenceIds(itemJsonSchema, schemasMap)

      referenceIds = [ ...referenceIds, itemRefSchemaId, ...nestedReferenceIds ]
      continue
    }

    if (itemProperties) {
      const itemSchema = new Schema(itemProperties, `${id}.${propertyName}.items.properties`)
      const itemReferenceIds = getReferenceIds(itemSchema, schemasMap)

      referenceIds = [ ...referenceIds, ...itemReferenceIds ]
      continue
    }
  }

  return uniq(referenceIds)
}

module.exports = getReferenceIds
