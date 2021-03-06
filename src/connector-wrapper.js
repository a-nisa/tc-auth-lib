const {createFrame} = require('./iframe')
const {getToken} = require ('./token')

let iframe = null
let loading = null
let url = ''
let mock = false
let token = ''

export function configureConnector({connectorUrl, frameId, mockMode, mockToken}) {
  if (mockMode) {
    mock = true
    token = mockToken
  } else if (iframe) {
    console.warn('tc-accounts connector can only be configured once, this request has been ignored.')
  } else {
    iframe = createFrame(frameId, connectorUrl)
    url = connectorUrl 
    
    loading = new Promise( (resolve) => {
      iframe.onload = function() {
        loading = null
        resolve()
      }
    })
  }
}

const proxyCall = function() {
  if (mock) {
    throw new Error('connector is running in mock mode. This method (proxyCall) should not be invoked.')
  }

  if (!iframe) {
    throw new Error('connector has not yet been configured.')
  }

  function request() {
    /*return new Promise( (resolve, reject) => {
      function receiveMessage(e) {
          const safeFormat = e.data.type === SUCCESS || e.data.type === FAILURE
          if (safeFormat) {
              window.removeEventListener('message', receiveMessage)
              if (e.data.type === SUCCESS) resolve(e.data)
              if (e.data.type === FAILURE) reject(e.error)
          }
      }

      window.addEventListener('message', receiveMessage)

      const payload = Object.assign({}, { type: REQUEST }, params)

      iframe.contentWindow.postMessage(payload, url)
    }) */
    return new Promise((resolve, reject) => {
      const token = getToken('tcjwt')
      token ? resolve({ token: token }) : reject("tcjwt cookie not found")
    })
  }

  if (loading) {
    return loading = loading.then(request)
  } else {
    return request()
  }
}

export function getFreshToken() {
  if (mock) {
    if (token) {
      return Promise.resolve(token)
    } else {
      return Promise.reject('connector is running in mock mode, but no token has been specified.')
    }
  }

  return proxyCall()
    .then( data => data.token )
}



