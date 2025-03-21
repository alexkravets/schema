declare type SchemaAttribute = object;

export declare class Schema {
  constructor(
    source: Record<string, SchemaAttribute>,
    id: string,
    url?: string
  )
}

export declare class Validator {
  constructor(
    schemas: Schema[]
  )
}
