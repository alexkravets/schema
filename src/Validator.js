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

    const objectJson = JSON.stringify(object)
    const result = JSON.parse(objectJson)

    try {
      // NOTE: Drop attributes from objects that are not defined in schema.
      //       This is bad for FE developers, as they continue to send some
      //       trash to endpoints, but good for integrations with third party
      //       services, e.g. Telegram, when you do not want to define schema
      //       for the full payload. This method currently fails for cases when
      //       attribute is defined as object or array in schema, but value is
      //       a string. In this case validation method below would catch that.
      cleanupAttributes(result, jsonSchema, this._jsonSchemasMap)

      // NOTE: Normalize method helps to integrate objects built from URLs,
      //       where types are not defined, e.g. booleans are '1', 'yes' string
      //       or numbers are '1', '2'... strings.
      normalizeAttributes(result, jsonSchema, this._jsonSchemasMap)

    } catch (error) {
      // NOTE: Skip errors in cleanup and normalize attributes methods,
      //       validation fails for objects with invalid value types.

    }

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
