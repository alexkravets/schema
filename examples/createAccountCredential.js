'use strict'

const { Schema, CredentialFactory } = require('../src')

const accountSchema = new Schema({
  id:          {},
  username:    { required: true },
  createdAt:   { format: 'date-time', required: true },
  dateOfBirth: { format: 'date' }
}, 'Account')

const factory = new CredentialFactory('https://example.com/schema/AccountV1', accountSchema)

const createAccountCredential = (holder, username) => {
  const id = `https://example.com/account/${username}`

  const createdAt = new Date().toISOString()
  const subject = {
    id: holder,
    username,
    createdAt
  }

  return factory.createCredential(id, holder, subject)
}

module.exports = createAccountCredential
