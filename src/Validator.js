'use strict'

const keyBy               = require('lodash.keyby')
const groupBy             = require('lodash.groupby')
const ZSchema             = require('z-schema')
const getReferenceIds     = require('./helpers/getReferenceIds')
const ValidationError     = require('./ValidationError')
const cleanupAttributes   = require('./helpers/cleanupAttributes')
const normalizeAttributes = require('./helpers/normalizeAttributes')

class Validator {
  constructor(schemas = []) {
    if (schemas.length === 0) {
      throw new Error('No schemas provided')
    }

    const groupsById = groupBy(schemas, 'id')

    for (const id in groupsById) {
      const schemas       = groupsById[id]
      const hasDuplicates = schemas.length > 1

      if (hasDuplicates) {
        throw new Error(`Multiple "${id}" schemas provided`)
      }
    }

    this._engine = new ZSchema({ ignoreUnknownFormats: true })

    const jsonSchemas = schemas.map(({ jsonSchema }) => jsonSchema)
    const isValid     = this._engine.validateSchema(jsonSchemas)

    if (!isValid) {
      const json = JSON.stringify(this._engine.lastReport.errors, null, 2)
      throw new Error(`Schemas validation failed:\n${json}`)
    }

    this._schemasMap     = keyBy(schemas, 'id')
    this._jsonSchemasMap = keyBy(jsonSchemas, 'id')
  }

  validate(object, schemaId) {
    const jsonSchema = this._jsonSchemasMap[schemaId]

    if (!jsonSchema) {
      throw new Error(`Schema "${schemaId}" not found`)
    }

    const result = JSON.parse(JSON.stringify(object))
    cleanupAttributes(result, jsonSchema, this._jsonSchemasMap)
    normalizeAttributes(result, jsonSchema, this._jsonSchemasMap)

    const isValid = this._engine.validate(result, jsonSchema)

    if (!isValid) {
      const validationErrors = this._engine.getLastErrors()
      throw new ValidationError(schemaId, result, validationErrors)
    }

    return result
  }

  normalize(object, schemaId) {
    const jsonSchema = this._jsonSchemasMap[schemaId]

    if (!jsonSchema) {
      throw new Error(`Schema "${schemaId}" not found`)
    }

    const result = JSON.parse(JSON.stringify(object))
    normalizeAttributes(result, jsonSchema, this._jsonSchemasMap)

    return result
  }

  get schemasMap() {
    return this._schemasMap
  }

  getReferenceIds(schemaId) {
    const schema = this._schemasMap[schemaId]
    return getReferenceIds(schema, this._schemasMap)
  }
}

module.exports = Validator
