import path from 'path';
import Schema from '../Schema';
import { load } from 'js-yaml';
import { keyBy } from 'lodash';
import type { EnumSchema, PropertiesSchema } from './JsonSchema';
import { readFileSync, readdirSync, statSync } from 'fs';

/**
 * Reads schema source from YAML file and returns a Schema instance.
 *
 * **Intent:** Load and parse a single YAML schema file, extracting the schema ID
 * from the filename and creating a Schema instance for use in validation or
 * schema composition.
 *
 * **Use Cases:**
 * - Load individual schema files during application startup
 * - Parse YAML schema definitions into Schema instances
 * - Extract schema identifiers from file paths automatically
 * - Support both enum and properties-based schemas from YAML files
 *
 * @param yamlPath - Absolute or relative path to the YAML schema file
 * @returns A Schema instance with ID extracted from the filename (without .yaml extension)
 *
 * **Example:**
 * ```typescript
 * const schema = loadSync('/path/to/schemas/User.yaml');
 * // schema.id === 'User'
 * // schema.source contains the parsed YAML content
 * ```
 *
 * **Example - Enum Schema:**
 * ```typescript
 * const statusSchema = loadSync('/path/to/schemas/Status.yaml');
 * // If Status.yaml contains: { enum: ['PENDING', 'ACTIVE'] }
 * // statusSchema.isEnum === true
 * ```
 */
const loadSync = (yamlPath: string) => {
  const schemaId = yamlPath
    .split('/')
    .reverse()[0]
    .split('.yaml')[0];

  const file = readFileSync(yamlPath);
  const source = load(file.toString()) as EnumSchema | PropertiesSchema;

  return new Schema(source, schemaId);
};

/**
 * Recursively lists all files in a directory and its subdirectories.
 *
 * **Intent:** Traverse a directory tree and collect all file paths, enabling
 * discovery of schema files nested in subdirectories without manual path specification.
 *
 * **Use Cases:**
 * - Find all schema files in a directory structure
 * - Support organized schema layouts with nested folders
 * - Enable schema discovery without hardcoding file paths
 * - Prepare file list for filtering and processing
 *
 * @param servicePath - Path to the directory to traverse
 * @returns Array of absolute file paths found in the directory tree
 *
 * **Example:**
 * ```typescript
 * const files = listFilesSync('/path/to/schemas');
 * // Returns: [
 * //   '/path/to/schemas/User.yaml',
 * //   '/path/to/schemas/nested/Profile.yaml',
 * //   '/path/to/schemas/nested/deep/Status.yaml'
 * // ]
 * ```
 *
 * **Example - Flat Directory:**
 * ```typescript
 * const files = listFilesSync('/path/to/schemas');
 * // Returns: [
 * //   '/path/to/schemas/User.yaml',
 * //   '/path/to/schemas/Profile.yaml'
 * // ]
 * ```
 */
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

/**
 * Reads all YAML schema files from a directory and creates Schema instances.
 *
 * **Intent:** Bulk load schema definitions from YAML files in a directory,
 * automatically discovering and parsing all schema files for use in schema
 * registries or validators.
 *
 * **Use Cases:**
 * - Load all schemas from a schemas directory at application startup
 * - Initialize schema registries from file-based definitions
 * - Support schema-as-code workflows where schemas are stored as YAML files
 * - Enable automatic schema discovery without manual registration
 *
 * @param servicePath - Path to the directory containing YAML schema files
 * @returns Array of Schema instances, one for each YAML file found
 *
 * **Example:**
 * ```typescript
 * const schemas = readSchemasSync('/path/to/examples/schemas');
 * // Returns: [
 * //   Schema { id: 'FavoriteItem', ... },
 * //   Schema { id: 'Profile', ... },
 * //   Schema { id: 'Status', ... },
 * //   Schema { id: 'Preferences', ... }
 * // ]
 * ```
 *
 * **Example - With Nested Directories:**
 * ```typescript
 * const schemas = readSchemasSync('/path/to/schemas');
 * // Automatically finds schemas in subdirectories:
 * // - /path/to/schemas/User.yaml
 * // - /path/to/schemas/nested/Profile.yaml
 * ```
 */
const readSchemasSync = (servicePath: string) =>
  listFilesSync(servicePath)
    .filter((fileName: string) => fileName.endsWith('.yaml'))
    .map((schemaPath: string) => loadSync(schemaPath));

/**
 * Creates a map of schemas by ID, loading from YAML files and merging with programmatic schemas.
 *
 * **Intent:** Build a centralized schema registry that combines file-based YAML schemas
 * with programmatically created Schema instances, providing a unified lookup mechanism
 * by schema ID. This enables hybrid schema management where some schemas are defined
 * in YAML files while others are created dynamically in code.
 *
 * **Use Cases:**
 * - Initialize schema registries for validators from both files and code
 * - Support schema composition where base schemas come from files and extended
 *   schemas are created programmatically
 * - Enable schema overriding where programmatic schemas can replace file-based ones
 * - Build schema maps for credential factories or API validation systems
 * - Support development workflows where schemas evolve from YAML to code
 *
 * @param servicePath - Path to directory containing YAML schema files (searched recursively)
 * @param modules - Array of Schema instances or other values (non-Schema values are filtered out)
 * @returns Record mapping schema IDs to Schema instances, with modules schemas overriding YAML schemas
 *
 * **Example - Basic Usage:**
 * ```typescript
 * const schemasMap = createSchemasMap('/path/to/examples/schemas', []);
 * // Returns: {
 * //   FavoriteItem: Schema { id: 'FavoriteItem', ... },
 * //   Profile: Schema { id: 'Profile', ... },
 * //   Status: Schema { id: 'Status', ... },
 * //   Preferences: Schema { id: 'Preferences', ... }
 * // }
 * ```
 *
 * **Example - Merging Programmatic Schemas:**
 * ```typescript
 * const customSchema = new Schema(
 *   { customField: { type: 'string' } },
 *   'CustomSchema'
 * );
 * const schemasMap = createSchemasMap('/path/to/schemas', [customSchema]);
 * // schemasMap contains both YAML schemas and CustomSchema
 * ```
 *
 * **Example - Overriding YAML Schemas:**
 * ```typescript
 * const updatedProfile = new Schema(
 *   { name: { type: 'string' }, newField: { type: 'number' } },
 *   'Profile'
 * );
 * const schemasMap = createSchemasMap('/path/to/schemas', [updatedProfile]);
 * // schemasMap.Profile is the updatedProfile instance, not the YAML version
 * ```
 *
 * **Example - Filtering Non-Schema Values:**
 * ```typescript
 * const schema = new Schema({ field: { type: 'string' } }, 'Test');
 * const schemasMap = createSchemasMap('/path/to/schemas', [
 *   schema,
 *   'not a schema',
 *   { id: 'fake' },
 *   null
 * ]);
 * // Only the Schema instance is included, other values are ignored
 * ```
 */
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
