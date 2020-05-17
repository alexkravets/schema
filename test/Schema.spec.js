'use strict'

const { Schema } = require('src')
const { expect } = require('chai')

describe('Schema', () => {
  describe('Schema.loadSync(yamlPath)', () => {
    it('creates schema from YAML file', () => {
      const profileSchema = Schema.loadSync('test/schemas/Profile.yaml')

      expect(profileSchema.id).to.eql('Profile')
    })
  })

  describe('Schema.constructor(source = {}, id = UNDEFINED_SCHEMA_ID)', () => {
    it('creates empty schema with default id', () => {
      const schema = new Schema()

      expect(schema.id).to.equal('UNDEFINED_SCHEMA_ID')
      expect(schema.source).to.be.empty
    })

    it('extends schema properties with types', () => {
      const schema = Schema.loadSync('test/schemas/Profile.yaml')

      expect(schema.source.name.type).to.eql('string')
      expect(schema.source.gender.type).to.eql('string')
      expect(schema.source.tags.items.type).to.eql('string')
      expect(schema.source.favoriteItems.type).to.eql('array')
      expect(schema.source.favoriteItems.items.type).to.not.exist
      expect(schema.source.locations.type).to.eql('array')
      expect(schema.source.locations.items.type).to.eql('object')
      expect(schema.source.locations.items.properties.name.type).to.eql('string')
      expect(schema.source.locations.items.properties.address.type).to.eql('object')
      expect(schema.source.locations.items.properties.address.properties.zip.type).to.eql('string')
      expect(schema.source.locations.items.properties.address.properties.city.type).to.eql('string')
      expect(schema.source.locations.items.properties.address.properties.country.type).to.eql('string')
      expect(schema.source.locations.items.properties.address.properties.addressLine1.type).to.eql('string')
      expect(schema.source.locations.items.properties.address.properties.addressLine2.type).to.eql('string')

      const stringEnumSchema = new Schema({ enum: [ 'L', 'M', 'S'] }, 'Size')

      expect(stringEnumSchema.source.type).to.eql('string')

      const numbersEnumSchema = new Schema({ enum: [ 1, 2, 3 ], type: 'number' }, 'Points')

      expect(numbersEnumSchema.source.type).to.eql('number')
    })

    it('creates schema from other schemas source', () => {
      const entitySchema = new Schema({ name: { type: 'string' } }, 'Entity')

      const schema = new Schema(entitySchema, 'EntityClone')

      expect(schema.id).to.equal('EntityClone')
      expect(schema.source).to.deep.equal(entitySchema.source)
    })
  })

  describe('.pure(id)', () => {
    it('returns schema without required and default attributes', () => {
      const profileSchema = Schema.loadSync('test/schemas/Profile.yaml')
      const updateProfileSchema = profileSchema.pure('UpdateProfile')

      expect(updateProfileSchema.id).to.eql('UpdateProfile')

      const { source } = updateProfileSchema

      expect(source.name.required).to.not.exist
      expect(source.gender.default).to.not.exist
      expect(source.contactDetails.required).to.not.exist
      expect(source.contactDetails.properties.email.required).to.not.exist
      expect(source.contactDetails.properties.mobileNumber.default).to.not.exist
      expect(source.locations.items.properties.name.require).to.not.exist
      expect(source.locations.items.properties.address.properties.country.required).to.not.exist
      expect(source.locations.items.properties.address.properties.country.default).to.not.exist
      expect(source.locations.items.properties.address.properties.city.required).to.not.exist
      expect(source.locations.items.properties.address.properties.addressLine1.required).to.not.exist
      expect(source.locations.items.properties.address.properties.addressLine2.required).to.not.exist
      expect(source.locations.items.properties.address.properties.zip.required).to.not.exist
    })
  })

  describe('.clone(id)', () => {
    it('returns schema clone', () => {
      const profileSchema = Schema.loadSync('test/schemas/Profile.yaml')

      const schema = profileSchema.clone('ProfileClone')
      expect(schema.id).to.eql('ProfileClone')
    })
  })

  describe('.only(propertyNames, id)', () => {
    it('returns schema with only requested properties', () => {
      const profileSchema = Schema.loadSync('test/schemas/Profile.yaml')

      const schema = profileSchema.only([ 'name', 'gender' ], 'ProfileClone')
      expect(schema.id).to.eql('ProfileClone')
    })
  })

  describe('.extend(properties, id)', () => {
    it('returns schema extended with specified properties', () => {
      const profileSchema = Schema.loadSync('test/schemas/Profile.yaml')

      const documentSource = {
        createdAt: {
          type:    'string',
          format:  'date-time',
          required: true
        }
      }

      const profileDocumentSchema = profileSchema.extend(documentSource, 'ProfileDocument')

      expect(profileDocumentSchema.id).to.eql('ProfileDocument')
      expect(profileDocumentSchema.source.createdAt).to.exist
    })
  })

  describe('.wrap(propertyName, options = { required: true }, id)', () => {
    it('returns schema that wraps source schema with object property', () => {
      const profileSchema = Schema.loadSync('test/schemas/Profile.yaml')

      const dataSchema = profileSchema.wrap('data')
      expect(dataSchema.id).to.eql('UNDEFINED_SCHEMA_ID')
      expect(dataSchema.source.data).to.exist
      expect(dataSchema.source.data.required).to.exist

      const alternativeDataSchema = profileSchema.wrap('data', { default: {} }, 'ResponseOutput')
      expect(alternativeDataSchema.id).to.eql('ResponseOutput')
      expect(alternativeDataSchema.source.data).to.exist
      expect(alternativeDataSchema.source.data.default).to.exist
      expect(alternativeDataSchema.source.data.required).to.not.exist
    })
  })

  describe('.jsonSchema', () => {
    it('returns json schema for enum type', () => {
      const source = {
        type: 'string',
        enum: [ 'L', 'M', 'S' ]
      }

      const sizeSchema = new Schema(source, 'Size')

      expect(sizeSchema.jsonSchema.id).to.eql('Size')
      expect(sizeSchema.jsonSchema.type).to.eql('string')
      expect(sizeSchema.jsonSchema.enum).to.deep.equal(source.enum)
    })

    it('returns json schema with normalized required attributes', () => {
      const profileSchema = Schema.loadSync('test/schemas/Profile.yaml')

      const { jsonSchema } = profileSchema

      expect(jsonSchema).to.have.property('type', 'object')
      expect(jsonSchema).to.have.property('properties')
      expect(jsonSchema.required).to.deep.equal([ 'name', 'contactDetails' ])
      expect(jsonSchema.properties.contactDetails.required).to.deep.equal([ 'email' ])
    })

    it('returns json schema without required attributes', () => {
      const schema = new Schema({ name: { type: 'string' } }, 'Entity')

      const { jsonSchema } = schema

      expect(jsonSchema.required).to.not.exist
    })
  })
})
