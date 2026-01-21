import { pick, cloneDeep } from 'lodash';

import validateId from './helpers/validateId';
import normalizeRequired from './helpers/normalizeRequired';
import normalizeProperties from './helpers/normalizeProperties';
import getLinkedDataContext from './ld/getLinkedDataContext';
import removeRequiredAndDefault from './helpers/removeRequiredAndDefault';
import type { LinkedDataContext } from './ld/getLinkedDataContext';
import type {
  JsonSchema,
  EnumSchema,
  PropertiesSchema,
  ObjectSchema
} from './helpers/JsonSchema';

const UNDEFINED_SCHEMA_ID = 'UNDEFINED_SCHEMA_ID';

export type LinkedDataType = {
  '@id': string;
  '@context': LinkedDataContext;
}

/** Schema to validate JS objects */
class Schema {
  private _id: string;
  private _url?: string;
  private _source: PropertiesSchema | EnumSchema;
  private _linkedDataType?: LinkedDataType;

  /** Schema constructor */
  constructor(propertiesOrSchema: EnumSchema | PropertiesSchema | Schema, id?: string, url?: string) {
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

  /** Returns schema ID */
  get id() {
    return this._id;
  }

  /** Returns schema URL */
  get url() {
    return this._url;
  }

  /** Returns schema properties */
  get source() {
    return cloneDeep(this._source);
  }

  /** Returns true if enum schema */
  get isEnum() {
    return !!this._source.enum;
  }

  /** Returns normalized JSON schema */
  get jsonSchema(): JsonSchema {
    if (this.isEnum) {
      return {
        id: this._id,
        ...this.source
      } as EnumSchema;
    }

    const jsonSchema = {
      id: this._id,
      type: 'object',
      properties: this.source
    } as ObjectSchema;

    normalizeRequired(jsonSchema);

    return jsonSchema;
  }

  /** Returns linked data type if url defined for the schema */
  get linkedDataType() {
    return this._linkedDataType;
  }

  /** Returns clone of the schema with a new ID */
  clone(id: string) {
    return new Schema(this.source, id);
  }

  /** Returns clone of the schema with a new ID without required properties and default values */
  pure(id: string) {
    if (this.isEnum) {
      throw new Error('The "pure" method is not supported for enum schemas.');
    }

    const { properties: source } = removeRequiredAndDefault({
      type: 'object',
      properties: this.source as PropertiesSchema
    });

    return new Schema(source, id);
  }

  /** Returns clone of the schema with a new ID without specified properties */
  only(propertyNames: string[], id: string) {
    if (this.isEnum) {
      throw new Error('The "only" method is not supported for enum schemas.');
    }

    const source = pick(this.source, propertyNames);
    return new Schema(source as PropertiesSchema, id);
  }

  /** Returns clone of the schema with a new ID extended by extra properties */
  extend(properties: PropertiesSchema, id: string) {
    if (this.isEnum) {
      throw new Error('The "extend" method is not supported for enum schemas.');
    }

    return new Schema({ ...this.source, ...properties }, id);
  }

  /** Returns new schema that wraps the one under specified property */
  wrap(propertyName: string, attributes: { default?: string; required?: boolean; }, id: string) {
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
