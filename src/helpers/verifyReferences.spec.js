'use strict'

const Schema     = require('../Schema')
const { expect } = require('chai')
const verifyReferences = require('./verifyReferences')

describe('verifyReferences(schemas)', () => {
  it('throws error if multiple schemas with same id', async () => {
    const exampleSchema1 = new Schema({
      number: { required: true }
    }, 'Example')

    const exampleSchema2 = new Schema({
      id: {}
    }, 'Example')

    expect(() => verifyReferences([ exampleSchema1, exampleSchema2 ]))
      .to.throw('Multiple "Example" schemas defined')
  })

  it('throws error if referenced schema not found', async () => {
    const exampleSchema = new Schema({
      document: { $ref: 'Document'}
    }, 'Example')

    expect(() => verifyReferences([ exampleSchema ]))
      .to.throw('Schema "Document" not found, referenced by "Example.document.$ref"')
  })
})
