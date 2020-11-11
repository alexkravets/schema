'use strict'

const { expect }     = require('chai')
const documentLoader = require('./documentLoader')

describe('documentLoader(documentUrl)', () => {
  it('throws error if context not found', () => {
    expect(
      () => documentLoader('https://example.com')
    ).to.throw('Custom context "https://example.com')
  })
})
