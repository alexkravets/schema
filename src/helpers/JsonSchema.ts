export type EnumSchema = {
  id?: string;
  enum: string[];
  type?: 'string' | 'number';
  default?: string | number;
  required?: boolean;
  'x-required'?: boolean;
};

export type ReferencePropertySchema = {
  $ref: string;
  default?: string | number | Record<string, unknown>;
  required?: boolean;
  'x-required'?: boolean;
};

export type StringPropertySchema = {
  '@type'?: string;
  type?: 'string';
  format?: 'date' | 'date-time' | 'url' | 'email',
  default?: string;
  pattern?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  'x-required'?: boolean;
};

export type NumberPropertySchema = {
  type: 'number';
  min?: number;
  max?: number;
  default?: number;
  required?: boolean;
  'x-required'?: boolean;
};

export type IntegerPropertySchema = {
  type: 'integer';
  default?: number;
  required?: boolean;
  'x-required'?: boolean;
};

export type BooleanPropertySchema = {
  type: 'boolean';
  default?: boolean;
  required?: boolean;
  'x-required'?: boolean;
};

export type ObjectPropertySchema = {
  type?: 'object';
  default?: Record<string, unknown>;
  required?: boolean;
  properties?: PropertiesSchema;
  'x-required'?: boolean;
}

export type ArrayPropertySchema = {
  type?: 'array';
  items?: ReferencePropertySchema | ObjectPropertySchema | StringPropertySchema | EnumSchema;
  default?: unknown[];
  required?: boolean;
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
