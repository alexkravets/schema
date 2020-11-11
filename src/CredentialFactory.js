'use strict'

const Schema        = require('./Schema')
const Validator     = require('./Validator')
const validateId    = require('./helpers/validateId')
const { constants } = require('credentials-context')

const { CREDENTIALS_CONTEXT_V1_URL } = constants

class CredentialFactory {
  // TODO: Add exception when added two schemas with the same name.
  constructor(uri, schemas) {
    validateId('uri', uri)

    this._types = [].concat(schemas).map(schema => {
      if (schema.url) {
        return schema
      }

      return new Schema(schema, schema.id, uri)
    })

    this._uri       = uri
    this._context   = {}
    this._validator = new Validator(this._types)

    for (const { id, linkedDataType } of this._types) {
      this._context[id] = linkedDataType
    }
  }

  createCredential(id, holder, subject = {}) {
    validateId('id', id)
    validateId('holder', holder)

    const [ credentialType ] = this._uri.split('/').reverse()

    const type = [ 'VerifiableCredential', credentialType ]

    const [ rootType ]      = this._types
    const credentialSubject = this._validator.validate(subject, rootType.id)

    return {
      '@context': [
        CREDENTIALS_CONTEXT_V1_URL,
        {
          [credentialType]: { '@id': this._uri },
          ...this._context
        }
      ],
      id,
      type,
      holder,
      credentialSubject
    }
  }
}

module.exports = CredentialFactory
