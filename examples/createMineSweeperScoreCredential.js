'use strict'

const { Schema, CredentialFactory } = require('../src')

const GAME_NAME    = 'MineSweeper'
const GAME_VERSION = '1.0'

const SCHEMA_ORG_URI = 'https://schema.org/'

const playerSchema = new Schema({
  id:                {},
  hasVideoGameScore: { $ref: 'VideoGameScore', required: true }
}, 'Player')

const videoGameSchema = new Schema({
  id:      {},
  name:    { type: 'string', required: true },
  version: { type: 'string', required: true }
}, 'VideoGame', SCHEMA_ORG_URI)

const videoGameScoreSchema = new Schema({
  game:          { $ref: 'VideoGame', required: true },
  wins:          { type: 'integer', required: true },
  losses:        { type: 'integer', required: true },
  winRate:       { type: 'number', required: true },
  bestScore:     { type: 'integer', required: true },
  // TODO: Add duration as format:
  endurance:     { type: 'string', required: true, '@type': 'schema:Duration' },
  dateCreated:   { type: 'string', 'format': 'date-time', required: true },
  bestRoundTime: { type: 'integer', required: true }
  // difficultyLevel:
  //   enum:
  //     - EASY
  //     - MEDIUM
  //     - HARD
  //   required: true
}, 'VideoGameScore')

const CREDENTIAL_URI = `https://example.com/schema/${GAME_NAME}ScoreV1`
const SCHEMAS = [ playerSchema, videoGameSchema, videoGameScoreSchema ]
const factory = new CredentialFactory(CREDENTIAL_URI, SCHEMAS)

const createMineSweeperScoreCredential = (gameId, playerId, playerScore) => {
  const credentialId = 'https://example.com/credentials/CREDENTIAL_ID'

  const game = {
    id:      gameId,
    name:    GAME_NAME,
    version: GAME_VERSION
  }

  const player = {
    id: playerId,
    hasVideoGameScore: {
      ...playerScore,
      game
    }
  }

  return factory.createCredential(credentialId, playerId, player)
}

module.exports = createMineSweeperScoreCredential
