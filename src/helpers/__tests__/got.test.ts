import got from '../got'

describe('got(object, path)', () => {
  describe('valid inputs - returns value when it exists', () => {
    it('should return value for simple property path', () => {
      const obj = { name: 'John', age: 30 }
      expect(got(obj, 'name')).toBe('John')
      expect(got(obj, 'age')).toBe(30)
    })

    it('should return value for nested property path', () => {
      const obj = { user: { profile: { name: 'John' } } }
      expect(got(obj, 'user.profile.name')).toBe('John')
      expect(got(obj, 'user.profile')).toEqual({ name: 'John' })
    })

    it('should return value for array index path', () => {
      const obj = { items: ['a', 'b', 'c'] }
      expect(got(obj, 'items[0]')).toBe('a')
      expect(got(obj, 'items[1]')).toBe('b')
      expect(got(obj, 'items[2]')).toBe('c')
    })

    it('should return value for nested array path', () => {
      const obj = { data: { items: [{ id: 1 }, { id: 2 }] } }
      expect(got(obj, 'data.items[0].id')).toBe(1)
      expect(got(obj, 'data.items[1].id')).toBe(2)
    })

    it('should return falsy values (null, false, 0, empty string)', () => {
      const obj = {
        nullValue: null,
        falseValue: false,
        zeroValue: 0,
        emptyString: '',
      }
      expect(got(obj, 'nullValue')).toBeNull()
      expect(got(obj, 'falseValue')).toBe(false)
      expect(got(obj, 'zeroValue')).toBe(0)
      expect(got(obj, 'emptyString')).toBe('')
    })

    it('should return object values', () => {
      const nestedObj = { nested: true }
      const obj = { data: nestedObj }
      expect(got(obj, 'data')).toBe(nestedObj)
      expect(got(obj, 'data')).toEqual({ nested: true })
    })

    it('should return array values', () => {
      const arr = [1, 2, 3]
      const obj = { items: arr }
      expect(got(obj, 'items')).toBe(arr)
      expect(got(obj, 'items')).toEqual([1, 2, 3])
    })

    it('should handle deeply nested paths', () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep'
              }
            }
          }
        }
      }
      expect(got(obj, 'level1.level2.level3.level4.value')).toBe('deep')
    })
  })

  describe('invalid inputs - throws error when value is undefined', () => {
    it('should throw error for non-existent simple property', () => {
      const obj = { name: 'John' }
      expect(() => got(obj, 'age')).toThrow('Value is undefined for "age"')
    })

    it('should throw error for non-existent nested property', () => {
      const obj = { user: { name: 'John' } }
      expect(() => got(obj, 'user.age')).toThrow('Value is undefined for "user.age"')
    })

    it('should throw error for non-existent deep nested property', () => {
      const obj = { level1: { level2: {} } }
      expect(() => got(obj, 'level1.level2.level3.value')).toThrow('Value is undefined for "level1.level2.level3.value"')
    })

    it('should throw error for non-existent array index', () => {
      const obj = { items: ['a', 'b'] }
      expect(() => got(obj, 'items[5]')).toThrow('Value is undefined for "items[5]"')
    })

    it('should throw error when accessing property on undefined parent', () => {
      const obj = { user: undefined }
      expect(() => got(obj, 'user.name')).toThrow('Value is undefined for "user.name"')
    })

    it('should throw error for empty object', () => {
      const obj = {}
      expect(() => got(obj, 'anyProperty')).toThrow('Value is undefined for "anyProperty"')
    })

    it('should throw error for non-existent root level property', () => {
      const obj = { existing: 'value' }
      expect(() => got(obj, 'nonExistent')).toThrow('Value is undefined for "nonExistent"')
    })

    it('should include the exact path in error message', () => {
      const obj = { data: {} }
      expect(() => got(obj, 'data.items[0].id')).toThrow('Value is undefined for "data.items[0].id"')
    })
  })

  describe('edge cases', () => {
    it('should handle paths with special characters in property names', () => {
      const obj = { 'property-with-dashes': 'value' }
      expect(got(obj, 'property-with-dashes')).toBe('value')
    })

    it('should handle numeric property names', () => {
      const obj = { '123': 'numeric-key' }
      expect(got(obj, '123')).toBe('numeric-key')
    })

    it('should handle empty arrays', () => {
      const obj = { items: [] }
      expect(() => got(obj, 'items[0]')).toThrow('Value is undefined for "items[0]"')
    })

    it('should handle null parent objects', () => {
      const obj = { user: null }
      expect(() => got(obj, 'user.name')).toThrow('Value is undefined for "user.name"')
    })

    it('should handle paths with brackets in different formats', () => {
      const obj = { items: ['a', 'b'] }
      expect(got(obj, 'items.0')).toBe('a')
      expect(got(obj, 'items[0]')).toBe('a')
    })
  })
})
