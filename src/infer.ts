import type { EnumSchema, PropertiesSchema, SchemaRegistry } from './types';

/** Flattens an intersection so that it is displayed as a single object type. */
type Prettify<T> = { [K in keyof T]: T[K] };

/** Resolves the type a `$ref` points at, or `unknown` when it is not registered. */
type ResolveReference<Id> = Id extends keyof SchemaRegistry
  ? SchemaRegistry[Id]
  : unknown;

/**
 * Returns the type a property is normalized to.
 *
 * Mirrors `normalizeProperties`: an explicit `type` wins, otherwise a property
 * carrying `properties` is an object, one carrying `items` is an array, and
 * anything else is a string.
 */
type EffectiveType<P> =
  P extends { type: infer T extends string } ? T :
  P extends { properties: unknown } ? 'object' :
  P extends { items: unknown } ? 'array' :
  'string';

/** Resolves a single property schema to the type it describes. */
type ResolveProperty<P> =
  P extends { $ref: infer Id } ? ResolveReference<Id> :
  P extends { enum: readonly (infer Value)[] } ? Value :
  EffectiveType<P> extends 'object'
    ? (P extends { properties: infer Properties } ? Prettify<InferProperties<Properties>> : Record<string, unknown>) :
  EffectiveType<P> extends 'array'
    ? (P extends { items: infer Items } ? ResolveProperty<Items>[] : string[]) :
  EffectiveType<P> extends 'number' | 'integer' ? number :
  EffectiveType<P> extends 'boolean' ? boolean :
  string;

/** Returns the keys of the properties that are flagged as required. */
type RequiredKeys<S> = {
  [K in keyof S]-?: S[K] extends { required: true } ? K : never;
}[keyof S];

/** Returns the keys of the properties that declare a default value. */
type DefaultedKeys<S> = {
  [K in keyof S]-?: S[K] extends { default: unknown } ? K : never;
}[keyof S];

/** Builds an object type from a properties schema, for the given required keys. */
type BuildProperties<S, Required extends keyof S> =
  & { -readonly [K in Required]: ResolveProperty<S[K]> }
  & { -readonly [K in Exclude<keyof S, Required>]?: ResolveProperty<S[K]> };

/** Builds an object type from a properties schema as it is accepted on input. */
type InferProperties<S> = BuildProperties<S, RequiredKeys<S>>;

/** Builds an object type from a properties schema as it is returned after validation. */
type InferOutputProperties<S> = BuildProperties<S, RequiredKeys<S> | DefaultedKeys<S>>;

/** Resolves a schema source to the type it describes, for the input view. */
export type InferSource<S> =
  S extends { enum: readonly (infer Value)[] }
    ? Value
    : Prettify<InferProperties<S>>;

/** Resolves a schema source to the type it describes, for the output view. */
export type InferSourceOutput<S> =
  S extends { enum: readonly (infer Value)[] }
    ? Value
    : Prettify<InferOutputProperties<S>>;

/** Schema source the inference types are able to read. */
export type InferableSource = EnumSchema | PropertiesSchema;

export type { Prettify };
