import { CC_DIRECTION_INCREMENT, createMapper, getCcDeltaDirection, getCcDirection, parseEnv } from '../src/mapper.js'
import { createMidiInput, createMidiOutput } from '../src/midi.js'
import createSocket from '../src/socket.js'
import { loadEnv } from './utils/load-env.js'

const resolveCcDirection = (data, mapping, state) => {
  if (mapping.type === 'cc_absolute') {
    const stateKey = `${data.channel}:${data.controller}`
    const previous = state.knobStates.get(stateKey)
    const direction = getCcDeltaDirection(data.value, previous)

    state.knobStates.set(stateKey, data.value)

    if (state.midiOutput) {
      if (state.inactivityTimers.has(stateKey)) clearTimeout(state.inactivityTimers.get(stateKey))

      state.inactivityTimers.set(
        stateKey,
        setTimeout(() => {
          state.midiOutput.sendCc(data.controller, 64, data.channel)
          state.knobStates.set(stateKey, 64)
        }, 2000),
      )
    }

    return direction
  }

  return getCcDirection(data.value)
}

export const run = async (options, overrides = {}) => {
  loadEnv(options.config)

  const webSocketUrl = process.env.LIGHTROOM_WS_URL || 'ws://127.0.0.1:7682'
  const deviceName = process.env.MIDI_INPUT_DEVICE

  if (!deviceName) {
    console.log('No MIDI device configured. Run `lightroom-midi-controller init` to set up your controller.')
    return
  }

  const mappings = parseEnv(process.env)

  if (mappings.length === 0) {
    console.log('No MIDI mappings configured. Run `lightroom-midi-controller init` to set up your controller.')
    return
  }

  const mapper = createMapper(mappings)
  const verboseLog = options.verbose ? (...args) => console.log(...args) : () => {}

  console.log(`Connecting to Lightroom at '${webSocketUrl}'`)
  const socket = await (overrides.createSocket || createSocket)(webSocketUrl)
  console.log(`Successfully paired with Lightroom at '${webSocketUrl}'`)

  console.log(`Opening MIDI device '${deviceName}'`)
  const midi = await (overrides.createMidiInput || createMidiInput)(deviceName)
  console.log(`Listening for MIDI events on '${deviceName}'`)

  const knobStates = new Map()
  const inactivityTimers = new Map()

  let midiOutput = null

  if (process.env.MIDI_OUTPUT_DEVICE) {
    try {
      midiOutput = await (overrides.createMidiOutput || createMidiOutput)(process.env.MIDI_OUTPUT_DEVICE)

      const absoluteMappings = mapper.mappings.filter((mapping) => mapping.type === 'cc_absolute')

      for (const mapping of absoluteMappings) {
        midiOutput.sendCc(mapping.control, 64, mapping.channel)
        knobStates.set(`${mapping.channel}:${mapping.control}`, 64)
      }

      console.log(`MIDI output opened on '${process.env.MIDI_OUTPUT_DEVICE}' — absolute knobs centered at 64`)
    } catch (error) {
      console.error(`Failed to open MIDI output device '${process.env.MIDI_OUTPUT_DEVICE}': ${error.message}`)
      midiOutput = null
    }
  }

  const state = { knobStates, inactivityTimers, midiOutput }

  midi.addEventListener('cc', (event) => {
    const { detail: data } = event
    const mapping = mapper.lookup(['cc_relative', 'cc_absolute'], data.channel, data.controller)

    if (mapping === undefined) {
      verboseLog(`[ignore] controller ${data.controller} channel ${data.channel} value ${data.value} — unmapped`)
      return
    }

    const direction = resolveCcDirection(data, mapping, state)

    if (direction === null) {
      verboseLog(`[ignore] controller ${data.controller} channel ${data.channel} value ${data.value} — rest position`)
      return
    }

    const message = direction === CC_DIRECTION_INCREMENT ? 'increment' : 'decrement'

    verboseLog(
      `[${message}] controller ${data.controller} channel ${data.channel} → ${mapping.parameter} (${mapping.amount})`,
    )

    socket.send([mapping.parameter, mapping.amount], message)
  })

  midi.addEventListener('noteon', (event) => {
    const { detail: data } = event

    if (data.velocity === 0) {
      verboseLog(`[ignore] note ${data.note} channel ${data.channel} velocity 0`)
      return
    }

    const actionMapping = mapper.lookup('note_on', data.channel, data.note)

    if (actionMapping !== undefined) {
      verboseLog(`[trigger] note ${data.note} channel ${data.channel} → ${actionMapping.action}`)

      socket.send(null, actionMapping.action)
      return
    }

    const adjustMapping = mapper.lookup('note_adjust', data.channel, data.note)

    if (adjustMapping !== undefined) {
      const message = data.note === adjustMapping.control ? 'increment' : 'decrement'

      verboseLog(
        `[${message}] note ${data.note} channel ${data.channel} → ${adjustMapping.parameter} (${adjustMapping.amount})`,
      )

      socket.send([adjustMapping.parameter, adjustMapping.amount], message)
      return
    }

    verboseLog(`[ignore] note ${data.note} channel ${data.channel} — unmapped`)
  })
}
