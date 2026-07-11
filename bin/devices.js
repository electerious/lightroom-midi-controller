import { listInputs, listOutputs } from '../src/midi.js'
import { loadEnv } from './utils/load-env.js'

export const devices = (configPath) => {
  loadEnv(configPath)

  const configuredInput = process.env.MIDI_INPUT_DEVICE
  const configuredOutput = process.env.MIDI_OUTPUT_DEVICE

  const inputs = listInputs()
  const outputs = listOutputs()

  if (inputs.length > 0) {
    console.log('Inputs:')

    for (const name of inputs) {
      const marker = name === configuredInput ? '* ' : '  '
      console.log(`${marker}${name}`)
    }
  } else {
    console.log('No MIDI input devices found.')
  }

  console.log()

  if (outputs.length > 0) {
    console.log('Outputs:')

    for (const name of outputs) {
      const marker = name === configuredOutput ? '* ' : '  '
      console.log(`${marker}${name}`)
    }
  } else {
    console.log('No MIDI output devices found.')
  }
}
