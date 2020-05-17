'use strict'

const normalizeRequired = jsonSchema => {
  const { properties } = jsonSchema

  if (!properties) { return }

  const required = []
  for (const name in properties) {
    const property = properties[name]

    if (property.required) {
      required.push(name)
    }

    delete properties[name].required

    const isObject = property.type === 'object'
    const isArray  = property.type === 'array'

    if (isObject) {
      normalizeRequired(property)
    }

    if (isArray) {
      const { items: itemJsonSchema } = property
      normalizeRequired(itemJsonSchema)
    }
  }

  if (required.length > 0) {
    jsonSchema.required = required
  }
}

module.exports = normalizeRequired
