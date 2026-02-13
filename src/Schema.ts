import type { JsonSchema } from 'z-schema';
import { pick, cloneDeep } from 'lodash';

import validateId from './helpers/validateId';
import normalizeRequired from './helpers/normalizeRequired';
import normalizeProperties from './helpers/normalizeProperties';
import getLinkedDataContext from './ld/getLinkedDataContext';
import removeRequiredAndDefault from './helpers/removeRequiredAndDefault';
import type { LinkedDataContext } from './ld/getLinkedDataContext';

const UNDEFINED_SCHEMA_ID = 'UNDEFINED_SCHEMA_ID';

/** JSON-LD linked data type structure for semantic web integration. */
export type LinkedDataType = {
  '@id': string;
  '@context': LinkedDataContext;
}

export type SchemaSource = EnumSchema | PropertiesSchema;

export type PropertiesSchemaSource = PropertiesSchema;

/** Schema class for defining and manipulating JSON schemas for object validation. */
class Schema {
  private _id: string;
  private _url?: string;
  private _source: PropertiesSchema | EnumSchema;
  private _linkedDataType?: LinkedDataType;

  /** Creates a new Schema instance. */
  constructor(propertiesOrSchema: Schema | SchemaSource, id?: string, url?: string) {
    this._id = id || UNDEFINED_SCHEMA_ID;

    this._url = url;

    const isSchema = propertiesOrSchema instanceof Schema;

    this._source = isSchema
      ? propertiesOrSchema.source
      : propertiesOrSchema;

    const isLinkedDataType = !!url && !this._source.enum;

    if (isLinkedDataType) {
      validateId('url', url);

      const source = this._source as PropertiesSchema;

      source.type = {
        type: 'string',
        default: id,
        required: true,
      };

      if (source.id) {
        source.id = {
          type: 'string',
          format: 'url',
          required: true,
        };
      }

      const uri = (url.endsWith('/') || url.endsWith('#'))
        ? `${url}${id}`
        : `${url}#${id}`;

      this._linkedDataType = {
        '@id': uri,
        '@context': getLinkedDataContext(source, url)
      };
    }

    normalizeProperties(this._source);
  }

  /** Returns the unique identifier for this schema. */
  get id() {
    return this._id;
  }

  /** Returns the URL associated with this schema for JSON-LD linked data generation. */
  get url() {
    return this._url;
  }

  /** Returns a deep clone of the schema's source properties or enum definition. */
  get source() {
    return cloneDeep(this._source);
  }

  /** Checks if this schema is an enum schema (defines a set of allowed values). */
  get isEnum() {
    return !!this._source.enum;
  }

  /** Returns a normalized JSON Schema representation of this schema. */
  get jsonSchema(): JsonSchema {
    if (this.isEnum) {
      return {
        id: this._id,
        ...this.source
      } as JsonSchema;
    }

    const jsonSchema = {
      id: this._id,
      type: 'object',
      properties: this.source
    } as ObjectSchema;

    normalizeRequired(jsonSchema);

    return jsonSchema as JsonSchema;
  }

  /** Returns the JSON-LD linked data type if a URL was provided during construction. */
  get linkedDataType() {
    return this._linkedDataType;
  }

  /** Creates a complete clone of the schema with a new identifier. */
  clone(id?: string) {
    return new Schema(this.source, id);
  }

  /** Creates a schema clone without required constraints and default values. */
  pure(id?: string) {
    if (this.isEnum) {
      throw new Error('The "pure" method is not supported for enum schemas.');
    }

    const { properties: source } = removeRequiredAndDefault({
      type: 'object',
      properties: this.source as PropertiesSchema
    });

    return new Schema(source, id);
  }

  /** Creates a schema clone containing only the specified properties. */
  only(propertyNames: string[], id?: string) {
    if (this.isEnum) {
      throw new Error('The "only" method is not supported for enum schemas.');
    }

    const source = pick(this.source, propertyNames);
    return new Schema(source as PropertiesSchema, id);
  }

  /** Creates a schema clone extended with additional properties. */
  extend(properties: PropertiesSchema, id?: string) {
    if (this.isEnum) {
      throw new Error('The "extend" method is not supported for enum schemas.');
    }

    return new Schema({ ...this.source, ...properties }, id);
  }

  /** Creates a new schema that wraps the current schema as a nested property. */
  wrap(propertyName: string, attributes: { default?: string; required?: boolean; }, id?: string) {
    if (this.isEnum) {
      throw new Error('The "wrap" method is not supported for enum schemas.');
    }

    const source = {
      [propertyName]: {
        type: 'object',
        properties: this.source,
        ...(attributes || { required: true })
      }
    } as PropertiesSchema;

    return new Schema(source, id);
  }
}

export default Schema;
