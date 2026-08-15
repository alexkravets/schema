/**
 * Maps a schema ID to the type it describes, so that a `$ref` can be resolved
 * while inferring a type from a schema.
 *
 * A `$ref` is a runtime string the validator resolves against its schemas map,
 * which the type system cannot follow on its own. Register a schema by merging
 * into this interface from the module that defines it:
 *
 * ```ts
 * export const schema = new Schema({ ... }, 'Profile');
 * export type Profile = Infer<typeof schema>;
 *
 * declare module '@kravc/schema' {
 *   interface SchemaRegistry {
 *     Profile: Profile;
 *   }
 * }
 * ```
 *
 * A `$ref` to an unregistered ID resolves to `unknown`. It stays an `interface`
 * so that a schema is able to reference itself.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SchemaRegistry {}

/**
 * Format a string value is validated against.
 *
 * Lists the formats JSON Schema defines, and accepts any other string, since
 * a service is able to register formats of its own.
 */
export type StringFormat =
  | 'date'
  | 'date-time'
  | 'duration'
  | 'email'
  | 'host-name'
  | 'hostname'
  | 'idn-email'
  | 'idn-hostname'
  | 'ipv4'
  | 'ipv6'
  | 'iri'
  | 'iri-reference'
  | 'json-pointer'
  | 'regex'
  | 'relative-json-pointer'
  | 'time'
  | 'uri'
  | 'uri-reference'
  | 'uri-template'
  | 'url'
  | 'uuid'
   
  | (string & {});

export type EnumSchema = {
  id?: string;
  enum: readonly string[] | readonly number[];
  type?: 'string' | 'number';
  default?: string | number;
  example?: string | number;
  required?: boolean;
  'x-title'?: string;
  description?: string;
  'x-required'?: boolean;
};

export type ReferencePropertySchema = {
  $ref: string;
  default?: string | number | Record<string, unknown>;
  example?: string | number | Record<string, unknown>;
  required?: boolean;
  'x-title'?: string;
  description?: string;
  'x-required'?: boolean;
};

export type StringPropertySchema = {
  '@type'?: string;
  type?: 'string';
  format?: StringFormat,
  default?: string;
  example?: string;
  pattern?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  'x-title'?: string;
  description?: string;
  'x-required'?: boolean;
};

export type NumberPropertySchema = {
  type: 'number';
  minimum?: number;
  maximum?: number;
  default?: number;
  example?: number;
  required?: boolean;
  'x-title'?: string;
  description?: string;
  'x-required'?: boolean;
};

export type IntegerPropertySchema = {
  type: 'integer';
  minimum?: number;
  maximum?: number;
  default?: number;
  example?: number;
  required?: boolean;
  'x-title'?: string;
  description?: string;
  'x-required'?: boolean;
};

export type BooleanPropertySchema = {
  type: 'boolean';
  default?: boolean;
  example?: boolean;
  required?: boolean;
  'x-title'?: string;
  description?: string;
  'x-required'?: boolean;
};

export type ObjectPropertySchema = {
  type?: 'object';
  default?: Record<string, unknown>;
  example?: unknown;
  required?: boolean;
  properties?: PropertiesSchema;
  'x-title'?: string;
  description?: string;
  'x-required'?: boolean;
}

export type ArrayPropertySchema = {
  type?: 'array';
  items?: (
    EnumSchema |
    ReferencePropertySchema |
    ObjectPropertySchema |
    ArrayPropertySchema |
    StringPropertySchema |
    NumberPropertySchema |
    IntegerPropertySchema |
    BooleanPropertySchema
  ) & {
    minItems?: number;
    maxItems?: number;
  };
  default?: readonly unknown[];
  example?: readonly unknown[];
  required?: boolean;
  'x-title'?: string;
  description?: string;
  'x-required'?: boolean;
};

export type PropertySchema =
  EnumSchema |
  ReferencePropertySchema |
  ObjectPropertySchema |
  ArrayPropertySchema |
  StringPropertySchema |
  NumberPropertySchema |
  IntegerPropertySchema |
  BooleanPropertySchema;

export type PropertiesSchema = Record<string, PropertySchema>;

export type ObjectSchema = {
  id: string;
  required?: string[];
  properties: PropertiesSchema;
};

export type TargetObject = Record<string, unknown>;
