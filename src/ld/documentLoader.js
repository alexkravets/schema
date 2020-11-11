'use strict'

const { contexts: securityContextsMap }    = require('security-context')
const { contexts: credentialsContextsMap } = require('credentials-context')

const CONTEXTS = new Map([ ...securityContextsMap, ...credentialsContextsMap ])

const documentLoader = documentUrl => {
  const contextUrl = null
  const [ url ] = documentUrl.split('#')

  const document = CONTEXTS.get(url)

  if (!document) {
    throw new Error(`Custom context "${documentUrl}" is not supported`)
  }

  return {
    document,
    contextUrl,
    documentUrl
  }
}

module.exports = documentLoader
