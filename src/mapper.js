const CC_DIRECTION_INCREMENT = 1
const CC_DIRECTION_DECREMENT = 2

const parseMapping = (type, parts, channel, control) => {
  switch (type) {
    case 'cc_relative':
    case 'cc_absolute': {
      const amount = Number(parts[3].trim())
      const parameter = parts[4] ? parts[4].trim() : null

      if (parameter === null) return null

      return { type, channel, control, parameter, amount }
    }
    case 'note_on': {
      const action = parts[4] ? parts[4].trim() : null

      if (action === null) return null

      return { type, channel, control, action }
    }
    case 'note_adjust': {
      if (parts.length < 6) return null

      const controlAlternate = Number(parts[3].trim())
      const amount = Number(parts[4].trim())

      if (Number.isNaN(controlAlternate) || Number.isNaN(amount)) return null

      const parameter = parts[5] ? parts[5].trim() : null

      if (parameter === null) return null

      return { type, channel, control, controlAlternate, parameter, amount }
    }
    default: {
      return null
    }
  }
}

const parseEnv = (env) => {
  const mappings = []

  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith('MIDI_MAP_')) continue

    const parts = value.split(',')

    if (parts.length < 4) continue

    const type = parts[0].trim().toLowerCase()
    const channel = Number(parts[1].trim())
    const control = Number(parts[2].trim())
    const mapping = parseMapping(type, parts, channel, control)

    if (mapping !== null) mappings.push(mapping)
  }

  return mappings
}

const getCcDirection = (value) => {
  if (value >= 1 && value <= 63) return CC_DIRECTION_INCREMENT
  if (value >= 65 && value <= 127) return CC_DIRECTION_DECREMENT

  return null
}

const getCcDeltaDirection = (value, previousValue) => {
  if (previousValue === undefined) return null

  const delta = value - previousValue

  if (delta > 64) return CC_DIRECTION_DECREMENT
  if (delta > 0) return CC_DIRECTION_INCREMENT
  if (delta < -64) return CC_DIRECTION_INCREMENT
  if (delta < 0) return CC_DIRECTION_DECREMENT

  return null
}

const createMapper = (mappings) => {
  const lookup = (mappingTypes, channel, control) => {
    const mappingTypeList = Array.isArray(mappingTypes) ? mappingTypes : [mappingTypes]

    return mappings.find((mapping) => {
      if (!mappingTypeList.includes(mapping.type) || mapping.channel !== channel) return false

      if (mapping.type === 'note_adjust') {
        return mapping.control === control || mapping.controlAlternate === control
      }

      return mapping.control === control
    })
  }

  return { lookup, mappings }
}

export { CC_DIRECTION_DECREMENT, CC_DIRECTION_INCREMENT, createMapper, getCcDeltaDirection, getCcDirection, parseEnv }
