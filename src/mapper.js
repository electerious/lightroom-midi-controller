const CC_DIRECTION_INCREMENT = 1
const CC_DIRECTION_DECREMENT = 2

const parseEnv = (env) => {
  const mappings = []

  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith('MIDI_MAP_')) continue

    const parts = value.split(',')

    if (parts.length < 4) continue

    const type = parts[0].trim().toLowerCase()
    const channel = Number.parseInt(parts[1].trim(), 10)
    const control = Number.parseInt(parts[2].trim(), 10)

    switch (type) {
      case 'cc_relative':
      case 'cc_absolute': {
        const amount = Number.parseFloat(parts[3].trim())
        const parameter = parts[4] ? parts[4].trim() : null

        if (parameter === null) continue

        mappings.push({ type, channel, control, parameter, amount })

        break
      }
      case 'note_on': {
        const action = parts[4] ? parts[4].trim() : null

        if (action === null) continue

        mappings.push({ type, channel, control, action })

        break
      }
      case 'note_adjust': {
        if (parts.length < 6) continue

        const controlAlternate = Number.parseInt(parts[3].trim(), 10)
        const amount = Number.parseFloat(parts[4].trim())

        if (Number.isNaN(controlAlternate) || Number.isNaN(amount)) continue

        const parameter = parts[5] ? parts[5].trim() : null

        if (parameter === null) continue

        mappings.push({ type, channel, control, controlAlternate, parameter, amount })

        break
      }
      default: {
        break
      }
    }
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
