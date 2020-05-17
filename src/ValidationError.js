'use strict'

const pick = require('lodash.pick')

class ValidationError extends Error {
  constructor(schemaId, invalidObject, validationErrors) {
    super(`"${schemaId}" validation failed`)

    this._object   = invalidObject
    this._schemaId = schemaId
    this._validationErrors = validationErrors.map(error => pick(error, [
      'path',
      'code',
      'params',
      'message',
      'schemaId'
    ]))
  }

  toJSON() {
    return {
      code:             this.constructor.name,
      object:           this._object,
      message:          this.message,
      schemaId:         this._schemaId,
      validationErrors: this._validationErrors
    }
  }
}

module.exports = ValidationError
