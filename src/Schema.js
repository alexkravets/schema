'use strict'

const pick                 = require('lodash.pick')
const cloneDeep            = require('lodash.clonedeep')
const validateId           = require('./helpers/validateId')
const normalizeRequired    = require('./helpers/normalizeRequired')
const normalizeProperties  = require('./helpers/normalizeProperties')
const getLinkedDataContext = require('./ld/getLinkedDataContext')
const removeRequiredAndDefault = require('./helpers/removeRequiredAndDefault')

const UNDEFINED_SCHEMA_ID = 'UNDEFINED_SCHEMA_ID'

class Schema {
  constructor(source = {}, id = UNDEFINED_SCHEMA_ID, url) {
    this._id     = id
    this._url    = url
    this._source = source instanceof Schema ? source.source : source

    if (url) {
      validateId('url', url)

      this._source.type = { required: true, type: 'string', default: id }

      if (this._source.id) {
        this._source.id = { required: true, type: 'string', format: 'url' }
      }

      const uri =
        (url.endsWith('/') || url.endsWith('#')) ? `${url}${id}` : `${url}#${id}`

      this._linkedDataType = {
        '@id':      uri,
        '@context': getLinkedDataContext(this._source, url)
      }
    }

    normalizeProperties(this._source)
  }

  get id() {
    return this._id
  }

  get url() {
    return this._url
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

  get linkedDataType() {
    return this._linkedDataType
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
}

module.exports = Schema
