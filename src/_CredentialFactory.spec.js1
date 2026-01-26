'use strict'

const Schema            = require('./Schema')
const { expect }        = require('chai')
const { canonize }      = require('jsonld')
const documentLoader    = require('./ld/documentLoader')
const CredentialFactory = require('./CredentialFactory')
const {
  createAccountCredential,
  createMineSweeperScoreCredential
} = require('examples')

describe('CredentialFactory', () => {
  describe('CredentialFactory.constructor(uri, schemas)', () => {
    it('throws error if "uri" parameter is missing', () => {
      expect(
        () => new CredentialFactory()
      ).to.throw()
    })

    it('throws error if "uri" parameter is not a URL', () => {
      expect(
        () => new CredentialFactory('BAD_URL')
      ).to.throw()
    })
  })

  describe('.createCredential(id, holder, subject = {}, subjectTypeId = null)', () => {
    let factory

    before(() => {
      const videoGameSchema = new Schema({
        id:      {},
        name:    { type: 'string', required: true },
        version: { type: 'string', required: true }
      }, 'VideoGame', 'https://schema.org/')

      factory = new CredentialFactory('https://example.com/StarCraft', videoGameSchema)
    })

    it('returns single schema based credential', async () => {
      const credential = await createAccountCredential('did:PLAYER_ID', 'CAHTEP')

      expect(credential).to.exist
      await canonize(credential, { documentLoader })

      const { credentialSubject: { createdAt } } = credential
      expect(credential).to.eql({
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          {
            AccountV1: { '@id': 'https://example.com/schema/AccountV1' },
            Account: {
              '@id': 'https://example.com/schema/AccountV1#Account',
              '@context': {
                '@vocab': 'https://example.com/schema/AccountV1#',
                '@version': 1.1,
                '@protected': true,
                schema: 'https://schema.org/',
                username: { '@id': 'username' },
                createdAt: { '@id': 'createdAt', '@type': 'schema:DateTime' },
                dateOfBirth: { '@id': 'dateOfBirth', '@type': 'schema:Date' }
              }
            }
          }
        ],
        id: 'https://example.com/account/CAHTEP',
        type: [ 'VerifiableCredential', 'AccountV1' ],
        holder: 'did:PLAYER_ID',
        credentialSubject: {
          id: 'did:PLAYER_ID',
          username: 'CAHTEP',
          createdAt,
          type: 'Account'
        }
      })
    })

    it('returns multiple schemas based credential', async () => {
      const playerScore = {
        wins:          5,
        losses:        5,
        winRate:       50,
        UNDEFINED:     'VALUE',
        bestScore:     23450,
        endurance:     'P5M22S',
        dateCreated:   '2020-10-10T00:00:00Z',
        bestRoundTime: 10000
      }

      const credential = await createMineSweeperScoreCredential(
        'did:GAME_ID',
        'did:PLAYER_ID',
        playerScore
      )

      expect(credential).to.exist
      await canonize(credential, { documentLoader })

      const { credentialSubject } = credential
      expect(credentialSubject.type).to.equal('Player')
      expect(credentialSubject.hasVideoGameScore.type).to.equal('VideoGameScore')
      expect(credentialSubject.hasVideoGameScore.game.type).to.equal('VideoGame')
      expect(credentialSubject.hasVideoGameScore.UNDEFINED).to.not.exist

      const customContext = credential['@context'][1]
      expect(customContext.VideoGame).to.eql({
        '@id': 'https://schema.org/VideoGame',
        '@context': {
          '@protected': true,
          '@version': 1.1,
          '@vocab': 'https://schema.org/',
          name: { '@id': 'name' },
          version: { '@id': 'version' }
        }
      })
    })

    it('throws error if "id" parameter is missing', () => {
      expect(
        () => factory.createCredential()
      ).to.throw('Parameter "id" is required')
    })

    it('throws error if "holder" parameter is missing', () => {
      expect(
        () => factory.createCredential('did:CREDENTIAL_ID')
      ).to.throw('Parameter "holder" is required')
    })
  })
})
