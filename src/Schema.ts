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
  PropertiesSchema
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
  private _source: PropertiesSchema;
  private _linkedDataType?: LinkedDataType;

  /** Schema constructor */
  constructor(propertiesOrSchema: PropertiesSchema | Schema, id?: string, url?: string) {
    this._id = id || UNDEFINED_SCHEMA_ID;

    this._url = url;

    this._source = propertiesOrSchema instanceof Schema
      ? propertiesOrSchema.source
      : propertiesOrSchema;

    if (url) {
      validateId('url', url);

      this._source.type = {
        type: 'string',
        default: id,
        required: true,
      };

      if (this._source.id) {
        this._source.id = {
          type: 'string',
          format: 'url',
          required: true,
        };
      }

      const uri = (url.endsWith('/') || url.endsWith('#'))
        ? `${url}${id}`
        : `${url}#${id}`;

      this._linkedDataType = {
        '@id':      uri,
        '@context': getLinkedDataContext(this._source, url)
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

  /** Returns normalized JSON schema */
  get jsonSchema(): JsonSchema {
    if (this._source.enum) {
      return {
        id: this._id,
        ...this.source
      } as EnumSchema;
    }

    const jsonSchema = {
      id: this._id,
      type: 'object',
      properties: this.source
    };

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
    const { properties: source } = removeRequiredAndDefault({
      type: 'object',
      properties: this.source
    });

    return new Schema(source, id);
  }

  /** Returns clone of the schema with a new ID without specified properties */
  only(propertyNames: string[], id: string) {
    const source = pick(this.source, propertyNames);
    return new Schema(source, id);
  }

  /** Returns clone of the schema with a new ID extended by extra properties */
  extend(properties: PropertiesSchema, id: string) {
    return new Schema({ ...this.source, ...properties }, id);
  }

  /** Returns new schema that wraps the one under specified property */
  wrap(propertyName: string, attributes: { default?: string; required?: boolean; }, id: string) {
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
