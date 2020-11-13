'use strict'

module.exports = {
  Schema:            require('./Schema'),
  Validator:         require('./Validator'),
  documentLoader:    require('./ld/documentLoader'),
  getReferenceIds:   require('./helpers/getReferenceIds'),
  CredentialFactory: require('./CredentialFactory')
}
