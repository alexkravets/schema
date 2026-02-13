import path from 'path';
import Schema from '../Schema';
import { load } from 'js-yaml';
import { keyBy } from 'lodash';
import { readFileSync, readdirSync, statSync } from 'fs';

/** Reads schema source from YAML file and returns a Schema instance. */
export const loadSync = (yamlPath: string) => {
  const schemaId = yamlPath
    .split('/')
    .reverse()[0]
    .split('.yaml')[0];

  const file = readFileSync(yamlPath);
  const source = load(file.toString()) as EnumSchema | PropertiesSchema;

  return new Schema(source, schemaId);
};

/** Recursively lists all files in a directory and its subdirectories. */
const listFilesSync = (servicePath: string): string[] =>
  readdirSync(servicePath)
    .reduce(
      (filePaths: string[], fileName: string) =>
        statSync(
          path.join(servicePath, fileName)).isDirectory() ?
            filePaths.concat(listFilesSync(path.join(servicePath, fileName))) :
            filePaths.concat(path.join(servicePath, fileName)
        )
    , []);

/** Reads all YAML schema files from a directory and creates Schema instances. */
const readSchemasSync = (servicePath: string) =>
  listFilesSync(servicePath)
    .filter((fileName: string) => fileName.endsWith('.yaml'))
    .map((schemaPath: string) => loadSync(schemaPath));

/** Creates a map of schemas by ID, loading from YAML files and merging with programmatic schemas. */
const createSchemasMap = (servicePath: string, modules: unknown[]): Record<string, Schema> => {
  const yamlSchemas = readSchemasSync(servicePath);
  const schemasMap = keyBy(yamlSchemas, 'id');

  const schemas = modules
    .filter(schema => schema instanceof Schema);

  for (const schema of schemas) {
    schemasMap[schema.id] = schema;
  }

  return schemasMap;
};

export default createSchemasMap;
