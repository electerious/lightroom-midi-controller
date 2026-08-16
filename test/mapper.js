import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CC_DIRECTION_DECREMENT,
  CC_DIRECTION_INCREMENT,
  createMapper,
  getCcDeltaDirection,
  getCcDirection,
  parseEnv,
} from '../src/mapper.js'

describe('parseEnv', () => {
  it('parses CC mappings from env', () => {
    const env = {
      MIDI_INPUT_DEVICE: 'Test Device',
      LIGHTROOM_WS_URL: 'ws://127.0.0.1:7682',
      MIDI_MAP_1: 'CC_RELATIVE,0,7,0.10,Exposure2012',
      MIDI_MAP_2: 'CC_RELATIVE,0,8,1.00,Contrast2012',
    }

    const mappings = parseEnv(env)

    assert.equal(mappings.length, 2)
    assert.deepEqual(mappings[0], {
      type: 'cc_relative',
      channel: 0,
      control: 7,
      parameter: 'Exposure2012',
      amount: 0.1,
    })
    assert.deepEqual(mappings[1], {
      type: 'cc_relative',
      channel: 0,
      control: 8,
      parameter: 'Contrast2012',
      amount: 1,
    })
  })

  it('parses NOTE_ON mappings from env', () => {
    const env = {
      MIDI_MAP_1: 'NOTE_ON,0,60,,nextPhoto',
      MIDI_MAP_2: 'NOTE_ON,0,61,,previousPhoto',
    }

    const mappings = parseEnv(env)

    assert.equal(mappings.length, 2)
    assert.deepEqual(mappings[0], {
      type: 'note_on',
      channel: 0,
      control: 60,
      action: 'nextPhoto',
    })
    assert.deepEqual(mappings[1], {
      type: 'note_on',
      channel: 0,
      control: 61,
      action: 'previousPhoto',
    })
  })

  it('parses NOTE_ADJUST mappings from env', () => {
    const env = {
      MIDI_MAP_1: 'NOTE_ADJUST,0,60,61,0.10,Exposure2012',
      MIDI_MAP_2: 'NOTE_ADJUST,0,62,63,1.00,Contrast2012',
    }

    const mappings = parseEnv(env)

    assert.equal(mappings.length, 2)
    assert.deepEqual(mappings[0], {
      type: 'note_adjust',
      channel: 0,
      control: 60,
      controlAlternate: 61,
      parameter: 'Exposure2012',
      amount: 0.1,
    })
    assert.deepEqual(mappings[1], {
      type: 'note_adjust',
      channel: 0,
      control: 62,
      controlAlternate: 63,
      parameter: 'Contrast2012',
      amount: 1,
    })
  })

  it('skips NOTE_ADJUST entries with fewer than 6 fields', () => {
    const env = {
      MIDI_MAP_1: 'NOTE_ADJUST,0,60,61,0.10',
    }

    const mappings = parseEnv(env)

    assert.equal(mappings.length, 0)
  })

  it('skips NOTE_ADJUST entries without a parameter name', () => {
    const env = {
      MIDI_MAP_1: 'NOTE_ADJUST,0,60,61,0.10,',
    }

    const mappings = parseEnv(env)

    assert.equal(mappings.length, 0)
  })

  it('parses CC_ABSOLUTE mappings from env', () => {
    const env = {
      MIDI_MAP_1: 'CC_ABSOLUTE,0,13,0.10,Exposure2012',
      MIDI_MAP_2: 'CC_ABSOLUTE,1,14,1.00,Contrast2012',
    }

    const mappings = parseEnv(env)

    assert.equal(mappings.length, 2)
    assert.deepEqual(mappings[0], {
      type: 'cc_absolute',
      channel: 0,
      control: 13,
      parameter: 'Exposure2012',
      amount: 0.1,
    })
    assert.deepEqual(mappings[1], {
      type: 'cc_absolute',
      channel: 1,
      control: 14,
      parameter: 'Contrast2012',
      amount: 1,
    })
  })

  it('skips CC_ABSOLUTE entries without a parameter name', () => {
    const env = {
      MIDI_MAP_1: 'CC_ABSOLUTE,0,7,0.10,',
    }

    const mappings = parseEnv(env)

    assert.equal(mappings.length, 0)
  })

  it('skips entries without MIDI_MAP_ prefix', () => {
    const env = {
      MIDI_INPUT_DEVICE: 'Test',
      MIDI_MAP_1: 'CC_RELATIVE,0,7,0.10,Exposure2012',
    }

    const mappings = parseEnv(env)

    assert.equal(mappings.length, 1)
  })

  it('skips invalid entries with fewer than 4 fields', () => {
    const env = {
      MIDI_MAP_1: 'CC_RELATIVE,0',
      MIDI_MAP_2: 'CC_RELATIVE,0,7,0.10,Exposure2012',
    }

    const mappings = parseEnv(env)

    assert.equal(mappings.length, 1)
  })

  it('skips CC entries without a parameter name', () => {
    const env = {
      MIDI_MAP_1: 'CC_RELATIVE,0,7,0.10,',
    }

    const mappings = parseEnv(env)

    assert.equal(mappings.length, 0)
  })

  it('skips NOTE_ON entries without an action name', () => {
    const env = {
      MIDI_MAP_1: 'NOTE_ON,0,60,,',
    }

    const mappings = parseEnv(env)

    assert.equal(mappings.length, 0)
  })

  it('trims whitespace from values', () => {
    const env = {
      MIDI_MAP_1: ' CC_RELATIVE , 0 , 7 , 0.10 , Exposure2012 ',
    }

    const mappings = parseEnv(env)

    assert.equal(mappings.length, 1)
    assert.deepEqual(mappings[0], {
      type: 'cc_relative',
      channel: 0,
      control: 7,
      parameter: 'Exposure2012',
      amount: 0.1,
    })
  })

  it('returns empty array when no MIDI_MAP_ entries exist', () => {
    const env = {
      MIDI_INPUT_DEVICE: 'Test',
      LIGHTROOM_WS_URL: 'ws://127.0.0.1:7682',
    }

    const mappings = parseEnv(env)

    assert.equal(mappings.length, 0)
  })
})

describe('createMapper', () => {
  it('lookup returns CC mapping for matching type, channel, and control', () => {
    const mappings = [{ type: 'cc_relative', channel: 0, control: 7, parameter: 'Exposure2012', amount: 0.1 }]

    const mapper = createMapper(mappings)
    const result = mapper.lookup('cc_relative', 0, 7)

    assert.deepEqual(result, mappings[0])
  })

  it('lookup returns NOTE_ON mapping for matching type, channel, and note', () => {
    const mappings = [{ type: 'note_on', channel: 0, control: 60, action: 'nextPhoto' }]

    const mapper = createMapper(mappings)
    const result = mapper.lookup('note_on', 0, 60)

    assert.deepEqual(result, mappings[0])
  })

  it('lookup returns undefined for unmatched channel', () => {
    const mappings = [{ type: 'cc_relative', channel: 0, control: 7, parameter: 'Exposure2012', amount: 0.1 }]

    const mapper = createMapper(mappings)
    const result = mapper.lookup('cc_relative', 1, 7)

    assert.equal(result, undefined)
  })

  it('lookup returns undefined for unmatched control', () => {
    const mappings = [{ type: 'cc_relative', channel: 0, control: 7, parameter: 'Exposure2012', amount: 0.1 }]

    const mapper = createMapper(mappings)
    const result = mapper.lookup('cc_relative', 0, 8)

    assert.equal(result, undefined)
  })

  it('lookup matches note_adjust by increase note', () => {
    const mappings = [
      { type: 'note_adjust', channel: 0, control: 60, controlAlternate: 61, parameter: 'Exposure2012', amount: 0.1 },
    ]

    const mapper = createMapper(mappings)
    const result = mapper.lookup('note_adjust', 0, 60)

    assert.deepEqual(result, mappings[0])
  })

  it('lookup matches note_adjust by decrease note', () => {
    const mappings = [
      { type: 'note_adjust', channel: 0, control: 60, controlAlternate: 61, parameter: 'Exposure2012', amount: 0.1 },
    ]

    const mapper = createMapper(mappings)
    const result = mapper.lookup('note_adjust', 0, 61)

    assert.deepEqual(result, mappings[0])
  })

  it('lookup returns undefined for unmatched note_adjust channel', () => {
    const mappings = [
      { type: 'note_adjust', channel: 0, control: 60, controlAlternate: 61, parameter: 'Exposure2012', amount: 0.1 },
    ]

    const mapper = createMapper(mappings)

    assert.equal(mapper.lookup('note_adjust', 1, 60), undefined)
  })

  it('lookup returns undefined for unmatched note_adjust note', () => {
    const mappings = [
      { type: 'note_adjust', channel: 0, control: 60, controlAlternate: 61, parameter: 'Exposure2012', amount: 0.1 },
    ]

    const mapper = createMapper(mappings)

    assert.equal(mapper.lookup('note_adjust', 0, 62), undefined)
  })

  it('lookup returns undefined for unmatched type', () => {
    const mappings = [{ type: 'cc_relative', channel: 0, control: 7, parameter: 'Exposure2012', amount: 0.1 }]

    const mapper = createMapper(mappings)
    const result = mapper.lookup('note_on', 0, 7)

    assert.equal(result, undefined)
  })

  it('lookup supports array of types for CC matching', () => {
    const mappings = [
      { type: 'cc_relative', channel: 0, control: 7, parameter: 'Exposure2012', amount: 0.1 },
      { type: 'cc_absolute', channel: 0, control: 14, parameter: 'Contrast2012', amount: 1 },
    ]

    const mapper = createMapper(mappings)

    assert.deepEqual(mapper.lookup(['cc_relative', 'cc_absolute'], 0, 7), mappings[0])
    assert.deepEqual(mapper.lookup(['cc_relative', 'cc_absolute'], 0, 14), mappings[1])
    assert.equal(mapper.lookup(['cc_relative', 'cc_absolute'], 0, 8), undefined)
  })

  it('getCcDirection returns increment for values 1-63', () => {
    assert.equal(getCcDirection(1), CC_DIRECTION_INCREMENT)
    assert.equal(getCcDirection(32), CC_DIRECTION_INCREMENT)
    assert.equal(getCcDirection(63), CC_DIRECTION_INCREMENT)
  })

  it('getCcDirection returns decrement for values 65-127', () => {
    assert.equal(getCcDirection(65), CC_DIRECTION_DECREMENT)
    assert.equal(getCcDirection(96), CC_DIRECTION_DECREMENT)
    assert.equal(getCcDirection(127), CC_DIRECTION_DECREMENT)
  })

  it('getCcDirection returns null for value 0 and 64', () => {
    assert.equal(getCcDirection(0), null)
    assert.equal(getCcDirection(64), null)
  })

  it('getCcDirection returns null for out of range values', () => {
    assert.equal(getCcDirection(128), null)
    assert.equal(getCcDirection(-1), null)
  })
})

describe('getCcDeltaDirection', () => {
  it('returns increment for positive delta within range', () => {
    assert.equal(getCcDeltaDirection(50, 48), CC_DIRECTION_INCREMENT)
    assert.equal(getCcDeltaDirection(127, 126), CC_DIRECTION_INCREMENT)
    assert.equal(getCcDeltaDirection(10, 5), CC_DIRECTION_INCREMENT)
  })

  it('returns decrement for negative delta within range', () => {
    assert.equal(getCcDeltaDirection(48, 50), CC_DIRECTION_DECREMENT)
    assert.equal(getCcDeltaDirection(0, 5), CC_DIRECTION_DECREMENT)
    assert.equal(getCcDeltaDirection(100, 105), CC_DIRECTION_DECREMENT)
  })

  it('handles positive wrap (127 → 0) as increment', () => {
    assert.equal(getCcDeltaDirection(0, 127), CC_DIRECTION_INCREMENT)
    assert.equal(getCcDeltaDirection(5, 125), CC_DIRECTION_INCREMENT)
  })

  it('handles negative wrap (0 → 127) as decrement', () => {
    assert.equal(getCcDeltaDirection(127, 0), CC_DIRECTION_DECREMENT)
    assert.equal(getCcDeltaDirection(125, 5), CC_DIRECTION_DECREMENT)
  })

  it('returns null for no change', () => {
    assert.equal(getCcDeltaDirection(64, 64), null)
    assert.equal(getCcDeltaDirection(0, 0), null)
    assert.equal(getCcDeltaDirection(127, 127), null)
  })

  it('returns null when prevValue is undefined', () => {
    assert.equal(getCcDeltaDirection(64), null)
    assert.equal(getCcDeltaDirection(0), null)
  })

  it('handles boundary values correctly', () => {
    assert.equal(getCcDeltaDirection(65, 64), CC_DIRECTION_INCREMENT)
    assert.equal(getCcDeltaDirection(63, 64), CC_DIRECTION_DECREMENT)
    assert.equal(getCcDeltaDirection(70, 5), CC_DIRECTION_DECREMENT)
  })
})
