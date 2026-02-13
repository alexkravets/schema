import path from 'path';
import Schema from '../../Schema';
import createSchemasMap from '../createSchemasMap';

describe('createSchemasMap', () => {
  const examplesSchemasPath = path.join(__dirname, '../../../examples/schemas');

  describe('loading schemas from YAML files', () => {
    it('should load all YAML schemas from the examples/schemas directory', () => {
      const schemasMap = createSchemasMap(examplesSchemasPath, []);

      expect(Object.keys(schemasMap).length).toBeGreaterThan(0);
      expect(schemasMap).toHaveProperty('FavoriteItem');
      expect(schemasMap).toHaveProperty('Profile');
      expect(schemasMap).toHaveProperty('Status');
      expect(schemasMap).toHaveProperty('Preferences');
    });

    it('should create Schema instances from YAML files', () => {
      const schemasMap = createSchemasMap(examplesSchemasPath, []);

      expect(schemasMap.FavoriteItem).toBeInstanceOf(Schema);
      expect(schemasMap.Profile).toBeInstanceOf(Schema);
      expect(schemasMap.Status).toBeInstanceOf(Schema);
      expect(schemasMap.Preferences).toBeInstanceOf(Schema);
    });

    it('should extract schema ID from YAML filename', () => {
      const schemasMap = createSchemasMap(examplesSchemasPath, []);

      expect(schemasMap.FavoriteItem.id).toBe('FavoriteItem');
      expect(schemasMap.Profile.id).toBe('Profile');
      expect(schemasMap.Status.id).toBe('Status');
      expect(schemasMap.Preferences.id).toBe('Preferences');
    });

    it('should handle enum schemas correctly', () => {
      const schemasMap = createSchemasMap(examplesSchemasPath, []);

      expect(schemasMap.Status).toBeInstanceOf(Schema);
      expect(schemasMap.Status.isEnum).toBe(true);
    });

    it('should handle properties schemas correctly', () => {
      const schemasMap = createSchemasMap(examplesSchemasPath, []);

      expect(schemasMap.Profile).toBeInstanceOf(Schema);
      expect(schemasMap.Profile.isEnum).toBe(false);
      expect(schemasMap.FavoriteItem).toBeInstanceOf(Schema);
      expect(schemasMap.FavoriteItem.isEnum).toBe(false);
    });
  });

  describe('merging modules array', () => {
    it('should merge Schema instances from modules array', () => {
      const customSchema = new Schema(
        { customField: { type: 'string' } },
        'CustomSchema'
      );

      const schemasMap = createSchemasMap(examplesSchemasPath, [customSchema]);

      expect(schemasMap.CustomSchema).toBeInstanceOf(Schema);
      expect(schemasMap.CustomSchema.id).toBe('CustomSchema');
    });

    it('should override YAML schemas with modules schemas if same ID', () => {
      const customProfile = new Schema(
        { customField: { type: 'string' } },
        'Profile'
      );

      const schemasMap = createSchemasMap(examplesSchemasPath, [customProfile]);

      expect(schemasMap.Profile).toBeInstanceOf(Schema);
      expect(schemasMap.Profile.id).toBe('Profile');
      // The custom schema should override the YAML one
      const source = schemasMap.Profile.source;
      expect(source).toHaveProperty('customField');
    });

    it('should filter out non-Schema instances from modules', () => {
      const customSchema = new Schema(
        { customField: { type: 'string' } },
        'CustomSchema'
      );
      const notASchema = { id: 'NotASchema', someProperty: 'value' };
      const alsoNotASchema = 'string value';

      const schemasMap = createSchemasMap(examplesSchemasPath, [
        customSchema,
        notASchema,
        alsoNotASchema,
        null,
        undefined,
      ]);

      expect(schemasMap.CustomSchema).toBeInstanceOf(Schema);
      expect(schemasMap).not.toHaveProperty('NotASchema');
    });

    it('should handle empty modules array', () => {
      const schemasMap = createSchemasMap(examplesSchemasPath, []);

      expect(Object.keys(schemasMap).length).toBeGreaterThan(0);
      expect(schemasMap.FavoriteItem).toBeInstanceOf(Schema);
    });

    it('should merge multiple Schema instances from modules', () => {
      const schema1 = new Schema({ field1: { type: 'string' } }, 'Schema1');
      const schema2 = new Schema({ field2: { type: 'number' } }, 'Schema2');
      const schema3 = new Schema({ field3: { type: 'boolean' } }, 'Schema3');

      const schemasMap = createSchemasMap(examplesSchemasPath, [
        schema1,
        schema2,
        schema3,
      ]);

      expect(schemasMap.Schema1).toBeInstanceOf(Schema);
      expect(schemasMap.Schema2).toBeInstanceOf(Schema);
      expect(schemasMap.Schema3).toBeInstanceOf(Schema);
      expect(schemasMap.Schema1.id).toBe('Schema1');
      expect(schemasMap.Schema2.id).toBe('Schema2');
      expect(schemasMap.Schema3.id).toBe('Schema3');
    });
  });

  describe('return value structure', () => {
    it('should return a Record<string, Schema>', () => {
      const schemasMap = createSchemasMap(examplesSchemasPath, []);

      expect(typeof schemasMap).toBe('object');
      expect(schemasMap).not.toBeNull();
      expect(Array.isArray(schemasMap)).toBe(false);

      // Check that all values are Schema instances
      Object.values(schemasMap).forEach((schema) => {
        expect(schema).toBeInstanceOf(Schema);
      });
    });

    it('should use schema ID as keys in the map', () => {
      const schemasMap = createSchemasMap(examplesSchemasPath, []);

      Object.entries(schemasMap).forEach(([key, schema]) => {
        expect(schema.id).toBe(key);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty directory gracefully', () => {
      const emptyDir = path.join(__dirname, '../../../examples');
      // This directory might have subdirectories but no YAML files directly
      // We'll test with a path that exists but may have no YAML files
      const schemasMap = createSchemasMap(emptyDir, []);

      expect(typeof schemasMap).toBe('object');
      // If there are no YAML files, the map should be empty or contain only what's in modules
    });

    it('should ignore non-YAML files', () => {
      const schemasMap = createSchemasMap(examplesSchemasPath, []);

      // Should only contain schemas from YAML files, not TypeScript files
      Object.keys(schemasMap).forEach((key) => {
        expect(key).not.toBe('FavoriteItemSchema');
        expect(key).not.toBe('ProfileSchema');
        expect(key).not.toBe('PreferencesSchema');
        expect(key).not.toBe('StatusSchema');
      });
    });

    it('should handle modules array with only non-Schema values', () => {
      const schemasMap = createSchemasMap(examplesSchemasPath, [
        'string',
        123,
        {},
        null,
        undefined,
      ]);

      // Should still have YAML schemas
      expect(schemasMap.FavoriteItem).toBeInstanceOf(Schema);
      expect(schemasMap.Profile).toBeInstanceOf(Schema);
    });
  });

  describe('schema content validation', () => {
    it('should correctly parse FavoriteItem schema', () => {
      const schemasMap = createSchemasMap(examplesSchemasPath, []);
      const favoriteItem = schemasMap.FavoriteItem;

      expect(favoriteItem).toBeInstanceOf(Schema);
      expect(favoriteItem.isEnum).toBe(false);
      const source = favoriteItem.source;
      expect(source).toHaveProperty('id');
      expect(source).toHaveProperty('name');
      expect(source).toHaveProperty('status');
    });

    it('should correctly parse Profile schema', () => {
      const schemasMap = createSchemasMap(examplesSchemasPath, []);
      const profile = schemasMap.Profile;

      expect(profile).toBeInstanceOf(Schema);
      expect(profile.isEnum).toBe(false);
      const source = profile.source;
      expect(source).toHaveProperty('name');
      expect(source).toHaveProperty('status');
      expect(source).toHaveProperty('gender');
    });

    it('should correctly parse Status enum schema', () => {
      const schemasMap = createSchemasMap(examplesSchemasPath, []);
      const status = schemasMap.Status;

      expect(status).toBeInstanceOf(Schema);
      expect(status.isEnum).toBe(true);
      const source = status.source;
      expect(source).toHaveProperty('enum');
      expect(Array.isArray(source.enum)).toBe(true);
    });

    it('should correctly parse Preferences schema', () => {
      const schemasMap = createSchemasMap(examplesSchemasPath, []);
      const preferences = schemasMap.Preferences;

      expect(preferences).toBeInstanceOf(Schema);
      expect(preferences.isEnum).toBe(false);
      const source = preferences.source;
      expect(source).toHaveProperty('age');
      expect(source).toHaveProperty('height');
      expect(source).toHaveProperty('isNotificationEnabled');
    });
  });
});
