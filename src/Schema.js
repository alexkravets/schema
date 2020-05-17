'use strict'

const pick                = require('lodash.pick')
const cloneDeep           = require('lodash.clonedeep')
const { safeLoad }        = require('js-yaml')
const { readFileSync }    = require('fs')
const normalizeRequired   = require('./helpers/normalizeRequired')
const normalizeProperties = require('./helpers/normalizeProperties')
const removeRequiredAndDefault = require('./helpers/removeRequiredAndDefault')

const UNDEFINED_SCHEMA_ID = 'UNDEFINED_SCHEMA_ID'

class Schema {
  constructor(source = {}, id = UNDEFINED_SCHEMA_ID) {
    this._id     = id
    this._source = source instanceof Schema ? source.source : source

    normalizeProperties(this._source)
  }

  get id() {
    return this._id
  }

  get source() {
    return cloneDeep(this._source)
  }

  get jsonSchema() {
    if (this._source.enum) {
      return {
        id: this._id,
        ...this.source
      }
    }

    const jsonSchema = {
      id:         this._id,
      type:       'object',
      properties: this.source
    }

    normalizeRequired(jsonSchema)

    return jsonSchema
  }

  clone(id) {
    return new Schema(this.source, id)
  }

  pure(id) {
    const { properties: source } = removeRequiredAndDefault({ properties: this.source })
    return new Schema(source, id)
  }

  only(propertyNames, id) {
    const source = pick(this.source, propertyNames)
    return new Schema(source, id)
  }

  extend(properties, id) {
    return new Schema({ ...this.source, ...properties }, id)
  }

  wrap(propertyName, options = { required: true }, id) {
    const source = {
      [propertyName]: {
        properties: this.source,
        ...options
      }
    }

    return new Schema(source, id)
  }

  static loadSync(yamlPath) {
    const id     = yamlPath.split('.')[0].split('/').reverse()[0]
    const source = safeLoad(readFileSync(yamlPath))

    return new Schema(source, id)
  }
}

module.exports = Schema
