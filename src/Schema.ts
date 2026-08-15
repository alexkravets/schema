import type { JsonSchema } from 'z-schema';
import { pick, cloneDeep } from 'lodash';

import validateId from './helpers/validateId';
import normalizeRequired from './helpers/normalizeRequired';
import normalizeProperties from './helpers/normalizeProperties';
import getLinkedDataContext from './ld/getLinkedDataContext';
import removeRequiredAndDefault from './helpers/removeRequiredAndDefault';
import type { LinkedDataContext } from './ld/getLinkedDataContext';
import type { EnumSchema, ObjectSchema, PropertiesSchema } from './types';
import type { InferSource, InferSourceOutput } from './infer';

const UNDEFINED_SCHEMA_ID = 'UNDEFINED_SCHEMA_ID';

/** JSON-LD linked data type structure for semantic web integration. */
export type LinkedDataType = {
  '@id': string;
  '@context': LinkedDataContext;
}

export type SchemaSource = EnumSchema | PropertiesSchema;

export type PropertiesSchemaSource = PropertiesSchema;

/** Removes `required` and `default` from a properties schema, recursively. */
type Pured<S> = {
  [K in keyof S]: Omit<S[K], 'required' | 'default'> extends infer Property
    ? Property extends { properties: infer Nested }
      ? Omit<Property, 'properties'> & { properties: Pured<Nested> }
      : Property extends { items: infer Items }
        ? Omit<Property, 'items'> & { items: Pured<{ item: Items }>['item'] }
        : Property
    : never;
};

/** Returns the source of a schema, narrowed to a properties schema. */
type Properties<S> = S extends PropertiesSchema ? S : PropertiesSchema;

/** Schema class for defining and manipulating JSON schemas for object validation. */
class Schema<const S = SchemaSource> {
  private _id: string;
  private _url?: string;
  private _source: PropertiesSchema | EnumSchema;
  private _linkedDataType?: LinkedDataType;

  /** Creates a new Schema instance. */
  constructor(propertiesOrSchema: Schema<S> | (S & SchemaSource), id?: string, url?: string) {
    this._id = id || UNDEFINED_SCHEMA_ID;

    this._url = url;

    const isSchema = propertiesOrSchema instanceof Schema;

    this._source = isSchema
      ? propertiesOrSchema.source as SchemaSource
      : cloneDeep(propertiesOrSchema);

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
    return cloneDeep(this._source) as S;
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
  clone(id?: string): Schema<S> {
    return new Schema(this.source as S & SchemaSource, id);
  }

  /** Creates a schema clone without required constraints and default values. */
  pure(id?: string): Schema<Pured<Properties<S>>> {
    if (this.isEnum) {
      throw new Error('The "pure" method is not supported for enum schemas.');
    }

    const { properties: source } = removeRequiredAndDefault({
      type: 'object',
      properties: this.source as PropertiesSchema
    });

    return new Schema(source as Pured<Properties<S>> & SchemaSource, id);
  }

  /** Creates a schema clone containing only the specified properties. */
  only<const K extends readonly (keyof Properties<S>)[]>(
    propertyNames: K,
    id?: string
  ): Schema<Pick<Properties<S>, K[number]>> {
    if (this.isEnum) {
      throw new Error('The "only" method is not supported for enum schemas.');
    }

    const source = pick(this.source, propertyNames as readonly string[]);
    return new Schema(source as Pick<Properties<S>, K[number]> & SchemaSource, id);
  }

  /** Creates a schema clone extended with additional properties. */
  extend<const E extends PropertiesSchema>(
    properties: E,
    id?: string
  ): Schema<Omit<Properties<S>, keyof E> & E> {
    if (this.isEnum) {
      throw new Error('The "extend" method is not supported for enum schemas.');
    }

    const source = { ...this.source, ...properties };
    return new Schema(source as unknown as Omit<Properties<S>, keyof E> & E & SchemaSource, id);
  }

  /** Creates a new schema that wraps the current schema as a nested property. */
  wrap<const N extends string, const A extends { default?: string; required?: boolean; }>(
    propertyName: N,
    attributes: A,
    id?: string
  ): Schema<{ [P in N]: { type: 'object'; properties: Properties<S> } & A }> {
    if (this.isEnum) {
      throw new Error('The "wrap" method is not supported for enum schemas.');
    }

    const source = {
      [propertyName]: {
        type: 'object',
        properties: this.source,
        ...(attributes || { required: true })
      }
    } as { [P in N]: { type: 'object'; properties: Properties<S> } & A } & SchemaSource;

    return new Schema(source, id);
  }
}

/** Resolves the type a schema describes, as it is accepted on input. */
export type Infer<T> = T extends Schema<infer S> ? InferSource<S> : never;

/**
 * Resolves the type a schema describes, as it is returned after validation,
 * where every property carrying a default is present.
 */
export type InferOutput<T> = T extends Schema<infer S> ? InferSourceOutput<S> : never;

export default Schema;
