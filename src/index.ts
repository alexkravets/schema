import got from './helpers/got';
import Validator from './Validator';
import documentLoader from './ld/documentLoader';
import CredentialFactory from './CredentialFactory';
import ValidationError, { type ValidationErrorOutput } from './ValidationError';
import Schema, {
  type Infer,
  type InferOutput,
  type SchemaSource,
  type PropertiesSchemaSource,
} from './Schema';

export {
  got,
  Schema,
  Validator,
  documentLoader,
  ValidationError,
  CredentialFactory
};

export type {
  Infer,
  InferOutput,
  SchemaSource,
  ValidationErrorOutput,
  PropertiesSchemaSource,
};

export type {
  EnumSchema,
  ObjectSchema,
  TargetObject,
  SchemaRegistry,
  PropertySchema,
  PropertiesSchema,
  ArrayPropertySchema,
  ObjectPropertySchema,
  StringPropertySchema,
  NumberPropertySchema,
  BooleanPropertySchema,
  IntegerPropertySchema,
  ReferencePropertySchema,
} from './types';
