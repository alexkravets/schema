'use strict'

const keyBy   = require('lodash.keyby')
const groupBy = require('lodash.groupby')
const getReferenceIds = require('./getReferenceIds')

const verifyReferences = schemas => {
  const groupsById = groupBy(schemas, 'id')

  for (const id in groupsById) {
    const schemas       = groupsById[id]
    const hasDuplicates = schemas.length > 1

    if (hasDuplicates) {
      throw new Error(`Multiple "${id}" schemas defined`)
    }
  }

  const schemasMap = keyBy(schemas, 'id')

  for (const schema of schemas) {
    getReferenceIds(schema, schemasMap)
  }
}

module.exports = verifyReferences
