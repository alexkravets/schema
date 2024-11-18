'use strict'

const { isUndefined } = require('lodash')

const normalizeProperties = properties => {
  const { enum: isEnum } = properties

  if (isEnum) {
    properties.type = properties.type || 'string'
    return
  }

  for (const name in properties) {
    const property = properties[name]

    const { type: hasType, $ref: isRef, items: hasItems, properties: hasProperties } = property

    if (!isRef) {
      if (!hasType) {
        if (hasProperties) {
          property.type = 'object'

        } else if (hasItems) {
          property.type = 'array'

        } else {
          property.type = 'string'

        }
      }

      const isArray  = property.type === 'array'
      const isObject = property.type === 'object'

      if (isObject) {
        if (!hasProperties) {
          property.properties = {}
        }

        normalizeProperties(property.properties)
      }

      if (isArray) {
        if (hasItems) {
          const isItemObject = !isUndefined(property.items.properties)

          if (isItemObject) {
            property.items.type = 'object'
            normalizeProperties(property.items.properties)
          }

        } else {
          property.items = { type: 'string' }

        }
      }
    }
  }
}

module.exports = normalizeProperties
