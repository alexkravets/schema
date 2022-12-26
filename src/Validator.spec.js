'use strict'

const { load }         = require('js-yaml')
const { expect }       = require('chai')
const { readFileSync } = require('fs')
const { Schema, Validator } = require('src')

const loadSync = (yamlPath) => {
  const id     = yamlPath.split('.')[0].split('/').reverse()[0]
  const source = load(readFileSync(yamlPath))

  return new Schema(source, id)
}

const SCHEMAS = [
  'examples/Status.yaml',
  'examples/Profile.yaml',
  'examples/Preferences.yaml',
  'examples/FavoriteItem.yaml'
].map(path => loadSync(path))

describe('Validator', () => {
  describe('Validator.constructor(schemas)', () => {
    it('create validator for schemas', () => {
      new Validator(SCHEMAS)
    })

    it('throws error if no schemas provided', () => {
      expect(
        () => new Validator()
      ).to.throw('No schemas provided')
    })

    it('throws error if referenced schema not found', () => {
      const entitySchema = new Schema({ name: { $ref: 'MissingSchema' } }, 'Entity')

      expect(
        () => new Validator([ ...SCHEMAS, entitySchema ])
      ).to.throw('Schemas validation failed:')
    })
  })

  describe('.validate(object, schemaId)', () => {
    it('returns validated, cleaned and normalized object', () => {
      const validator = new Validator(SCHEMAS)

      const _createdAt = new Date().toISOString()

      const input = {
        name: 'Oleksandr',
        contactDetails: {
          email: 'a@kra.vc'
        },
        favoriteItems: [{
          id:         '1',
          name:       'Student Book',
          categories: [ 'Education' ],
          _createdAt
        }],
        locations: [{
          name: 'Home',
          address: {
            type:         'Primary',
            zip:          '03119',
            city:         'Kyiv',
            addressLine1: 'Melnikova 83-D, 78',
            _createdAt
          },
          _createdAt
        }],
        preferences: {
          height:                180,
          isNotificationEnabled: true,
          _createdAt
        },
        status: 'Active',
        _createdAt
      }

      const validInput = validator.validate(input, 'Profile')

      expect(validInput._createdAt).to.not.exist
      expect(validInput.preferences._createdAt).to.not.exist
      expect(validInput.locations[0]._createdAt).to.not.exist
      expect(validInput.locations[0].address._createdAt).to.not.exist
      expect(validInput.favoriteItems[0]._createdAt).to.not.exist

      expect(validInput.name).to.eql('Oleksandr')
      expect(validInput.gender).to.eql('Other')
      expect(validInput.status).to.eql('Active')
      expect(validInput.locations[0].name).to.eql('Home')
      expect(validInput.locations[0].address.country).to.eql('Ukraine')
      expect(validInput.locations[0].address.zip).to.eql('03119')
      expect(validInput.locations[0].address.city).to.eql('Kyiv')
      expect(validInput.locations[0].address.addressLine1).to.eql('Melnikova 83-D, 78',)
      expect(validInput.locations[0].address.type).to.eql('Primary')
      expect(validInput.favoriteItems[0].id).to.eql('1')
      expect(validInput.favoriteItems[0].name).to.eql('Student Book')
      expect(validInput.favoriteItems[0].categories).to.deep.eql([ 'Education' ])
      expect(validInput.favoriteItems[0].status).to.eql('Pending')
      expect(validInput.contactDetails.email).to.eql('a@kra.vc')
      expect(validInput.contactDetails.mobileNumber).to.eql('+380504112171')
      expect(validInput.preferences.height).to.eql(180)
      expect(validInput.preferences.isNotificationEnabled).to.eql(true)
    })

    it('normalizes object attributes according to property type', () => {
      const validator = new Validator(SCHEMAS)

      const input = {
        name: 'Oleksandr',
        contactDetails: {
          email: 'a@kra.vc'
        },
        preferences: {
          height:                '180',
          isNotificationEnabled: 'true'
        }
      }

      let validInput

      validInput = validator.validate(input, 'Profile')
      expect(validInput.preferences.height).to.eql(180)
      expect(validInput.preferences.isNotificationEnabled).to.eql(true)

      input.preferences.isNotificationEnabled = '1'
      validInput = validator.validate(input, 'Profile')
      expect(validInput.preferences.isNotificationEnabled).to.eql(true)

      input.preferences.isNotificationEnabled = '0'
      validInput = validator.validate(input, 'Profile')
      expect(validInput.preferences.isNotificationEnabled).to.eql(false)

      input.preferences.isNotificationEnabled = 0
      validInput = validator.validate(input, 'Profile')
      expect(validInput.preferences.isNotificationEnabled).to.eql(false)

      expect(() => {
        input.preferences.isNotificationEnabled = 'NaN'
        validInput = validator.validate(input, 'Profile')
        expect(validInput.preferences.isNotificationEnabled).to.eql('NaN')
      }).to.throw('"Profile" validation failed')

      expect(() => {
        input.preferences.isNotificationEnabled = 0
        input.preferences.height = 'NaN'
        validInput = validator.validate(input, 'Profile')
        expect(validInput.preferences.height).to.eql('NaN')
      }).to.throw('"Profile" validation failed')
    })

    it('throws validation error if cleanup or normalize method failed', () => {
      const validator = new Validator(SCHEMAS)

      const input = {
        name: 'Oleksandr',
        contactDetails: {
          email: 'a@kra.vc'
        },
        favoriteItems: 'NOT_ARRAY_BUT_STRING'
      }

      try {
        validator.validate(input, 'Profile')

      } catch (validationError) {
        const error = validationError.toJSON()

        expect(error.object).to.exist
        expect(error.code).to.eql('ValidationError')
        expect(error.message).to.eql('"Profile" validation failed')
        expect(error.schemaId).to.eql('Profile')

        const errorMessage = error.validationErrors[0].message
        expect(errorMessage).to.eql('Expected type array but found type string')

        return
      }

      throw new Error('Validation error is not thrown')
    })

    it('throws error if validation failed', () => {
      const validator = new Validator(SCHEMAS)

      const input = {}

      try {
        validator.validate(input, 'Profile')

      } catch (validationError) {
        const error = validationError.toJSON()

        expect(error.object).to.exist
        expect(error.code).to.eql('ValidationError')
        expect(error.message).to.eql('"Profile" validation failed')
        expect(error.schemaId).to.eql('Profile')

        expect(error.validationErrors).to.have.lengthOf(2)

        return
      }

      throw new Error('Validation error is not thrown')
    })

    it('throws error if schema not found', () => {
      const validator = new Validator(SCHEMAS)

      expect(
        () => validator.validate({}, 'Account')
      ).to.throw('Schema "Account" not found')
    })

    it('throws error if multiple schemas with same id', async () => {
      const exampleSchema1 = new Schema({
        number: { required: true }
      }, 'Example')

      const exampleSchema2 = new Schema({
        id: {}
      }, 'Example')

      expect(() => new Validator([ exampleSchema1, exampleSchema2 ]))
        .to.throw('Multiple "Example" schemas provided')
    })
  })

  describe('.normalize(object, schemaId)', () => {
    it('returns normalized object clone', () => {
      const validator = new Validator(SCHEMAS)

      const input = {}

      const normalizedInput = validator.normalize(input, 'Profile')

      expect(normalizedInput.gender).to.eql('Other')
      expect(normalizedInput.status).to.eql('Pending')
    })

    it('throws error if schema not found', () => {
      const validator = new Validator(SCHEMAS)

      expect(
        () => validator.normalize({}, 'Account')
      ).to.throw('Schema "Account" not found')
    })
  })

  describe('.schemasMap', () => {
    it('returns schemas map', () => {
      const validator = new Validator(SCHEMAS)

      expect(validator.schemasMap).to.exist
    })
  })

  describe('.getReferenceIds(schemaId)', () => {
    it('returns ids of referenced schemas', () => {
      const validator    = new Validator(SCHEMAS)
      const referenceIds = validator.getReferenceIds('Profile')

      expect(referenceIds).to.eql([ 'Status', 'FavoriteItem', 'Preferences' ])
    })
  })
})
