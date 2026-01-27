export type EnumSchema = {
  id?: string;
  enum: string[] | number[];
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
  format?: 'date' | 'date-time' | 'url' | 'email',
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
  items?: (ReferencePropertySchema | ObjectPropertySchema | StringPropertySchema | EnumSchema) & {
    minItems?: number;
    maxItems?: number;
  };
  default?: unknown[];
  example?: unknown[];
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

export type JsonSchema = EnumSchema | ObjectSchema;

export type JsonSchemasMap = Record<string, JsonSchema>;

export type TargetObject = Record<string, unknown>;
