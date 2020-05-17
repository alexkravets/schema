'use strict'

const removeRequiredAndDefault = jsonSchema => {
  const { properties } = jsonSchema

  if (!properties) { return }

  for (const name in properties) {
    const property = properties[name]

    delete property.required
    delete property.default

    const isObject = property.type === 'object'
    const isArray  = property.type === 'array'

    if (isObject) {
      removeRequiredAndDefault(property)
    }

    if (isArray) {
      const { items: itemsJsonSchema } = property
      removeRequiredAndDefault(itemsJsonSchema)
    }
  }

  return { properties }
}

module.exports = removeRequiredAndDefault
