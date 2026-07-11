import easymidi from 'easymidi'

const listInputs = () => {
  const inputs = easymidi.getInputs()

  return inputs.toSorted((a, b) => a.localeCompare(b))
}

const listOutputs = () => {
  const outputs = easymidi.getOutputs()

  return outputs.toSorted((a, b) => a.localeCompare(b))
}

const createMidiInput = (deviceName) => {
  const { promise, resolve, reject } = Promise.withResolvers()
  const target = new EventTarget()

  let input

  try {
    input = new easymidi.Input(deviceName)
  } catch (error) {
    reject(new Error(`MIDI device '${deviceName}' not found`, { cause: error }))

    return promise
  }

  const forwardEvent = (type) => {
    input.on(type, (data) => {
      target.dispatchEvent(new CustomEvent(type, { detail: data }))
    })
  }

  forwardEvent('cc')
  forwardEvent('noteon')
  forwardEvent('noteoff')

  target.close = () => {
    input.close()
  }

  resolve(target)

  return promise
}

const createMidiOutput = (deviceName) => {
  const { promise, resolve, reject } = Promise.withResolvers()

  try {
    const output = new easymidi.Output(deviceName)

    resolve({
      sendCc: (controller, value, channel) => {
        output.send('cc', { controller, value, channel })
      },
      close: () => {
        output.close()
      },
    })
  } catch (error) {
    reject(new Error(`MIDI output device '${deviceName}' not found`, { cause: error }))
  }

  return promise
}

export { createMidiInput, createMidiOutput, listInputs, listOutputs }
