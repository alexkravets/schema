'use strict'

const getLinkedDataType = require('./getLinkedDataType')

const SCHEMA_ORG_URI = 'https://schema.org/'

const PROTECTED_PROPERTIES = [
  'id',
  'type',
  'schema'
]

// TODO: Add support for embedded object, array and enum.
const getLinkedDataContext = (properties, vocabUri) => {
  const context = {}

  for (const key in properties) {
    const schema = properties[key]

    const isProtected = PROTECTED_PROPERTIES.includes(key) || key.startsWith('@')

    if (isProtected) {
      continue
    }

    const { $ref } = schema

    if ($ref) {
      context[key] = { '@id': key }
      continue
    }

    context[key] = { '@id': key }

    const linkedDataType = getLinkedDataType(schema)

    if (linkedDataType) {
      context[key]['@type'] = linkedDataType
    }
  }

  const vocab =
    vocabUri.endsWith('/') || vocabUri.endsWith('#') ? vocabUri : `${vocabUri}#`

  const contextHeader = {
    '@vocab':     vocab,
    '@version':   1.1,
    '@protected': true
  }

  const isSchemaOrgDomain = vocab === SCHEMA_ORG_URI

  if (!isSchemaOrgDomain) {
    contextHeader.schema = SCHEMA_ORG_URI
  }

  return {
    ...contextHeader,
    ...context
  }
}

module.exports = getLinkedDataContext
