import { randomUUID } from 'node:crypto'
import { WebSocket } from 'ws'
import packageInfo from '../package.json' with { type: 'json' }

const appName = packageInfo.name
const appVersion = packageInfo.version
const optionalClientGUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

const createRequest = (parameters, message) => {
  return {
    requestId: randomUUID(),
    object: null,
    params: parameters,
    message,
  }
}

const createSocket = (url) => {
  const { promise, resolve, reject } = Promise.withResolvers()

  const listeners = new Map()

  const addListener = (requestId, resolve, reject, timeout = 5000) => {
    listeners.set(requestId, { resolve, reject })

    setTimeout(() => {
      if (listeners.has(requestId)) {
        const error = new Error('Timeout waiting for answer')
        listeners.get(requestId).reject(error)
        removeListener(requestId)
      }
    }, timeout)
  }

  const removeListener = (requestId) => {
    listeners.delete(requestId)
  }

  const send = (parameters, message, timeout) => {
    const request = createRequest(parameters, message)
    const { requestId } = request

    return new Promise((resolve, reject) => {
      addListener(requestId, resolve, reject, timeout)

      webSocket.send(JSON.stringify(request), (error) => {
        if (error) {
          removeListener(requestId)
          reject(error)
        }
      })
    })
  }

  const webSocket = new WebSocket(url)

  webSocket.on('open', async () => {
    const answer = await send([appName, appVersion, optionalClientGUID], 'register', 60000)

    if (answer.success) {
      resolve(instance)
    } else {
      reject(new Error('Failed to pair with Lightroom', { cause: answer }))
    }
  })

  webSocket.on('message', (data) => {
    const answer = JSON.parse(data)
    const { requestId, message } = answer

    if (message === 'close') {
      webSocket.close()

      return
    }

    if (listeners.has(requestId)) {
      listeners.get(requestId).resolve(answer)
      listeners.delete(requestId)

      return
    }
  })

  webSocket.on('close', () => {
    console.log('Connection closed by Lightroom')
    process.exit(0)
  })

  webSocket.on('error', (error) => {
    console.error('WebSocket error:', error.message)
    process.exit(1)
  })

  const instance = {
    send,
  }

  return promise
}

export default createSocket
