'use strict'

const { isURL } = require('validator')

const validateId = (name, value) => {
  if (!value) {
    throw new Error(`Parameter "${name}" is required`)
  }

  const isURI = value.toLowerCase().startsWith('did:') || isURL(value)

  if (isURI) {
    return
  }

  throw new Error(`Parameter "${name}" must be a URL, received: "${value}"`)
}

module.exports = validateId
