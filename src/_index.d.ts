declare type SchemaAttribute = object;
export declare type SchemaAttributes = Record<string, SchemaAttribute>;
declare type Enum = { enum: string[] };
declare type Source = Enum | SchemaAttributes;

export declare class Schema {
  constructor(
    source: Source,
    id: string,
    url?: string
  )

  get id(): string;
  get source(): Source;

  only(propertyNames: string[], id?: string): Schema;
  wrap(propertyName: string, options?: Record<string, any>, id?: string): Schema;
  extend(properties: Record<string, any>, id?: string): Schema;
}

export declare class Validator {
  constructor(
    schemas: Schema[]
  )
}
