const { LoggingWinston } = require('@google-cloud/logging-winston')
const onFinished = require('on-finished')
const onHeaders = require('on-headers')
const {
  createLogger,
  transports: { Console }
} = require('winston')
const LegacyTransportStream = require('winston-transport/legacy')

const level = process.env.LOG_LEVEL || 'info'
const transports = [new Console()]
const loggingBackends = process.env.LOG_BACKENDS || 'gcp'

const fields = {}

if (loggingBackends.indexOf('gcp') > -1) {
  const gcpLogging = new LoggingWinston()

  gcpLogging.name = 'gcp-logging'
  LegacyTransportStream.prototype._deprecated = () => {}

  transports.push(gcpLogging)
  fields.LOGGING_TRACE_KEY = LoggingWinston.LOGGING_TRACE_KEY
}

const logger = createLogger({
  transports,
  level
})

logger.request = (req, res) => {
  logger.info(`${req.url} endpoint hit`, {
    httpRequest: {
      status: res.statusCode,
      requestUrl: req.url,
      requestMethod: req.method,
      remoteIp: req.connection.remoteAddress
    }
  })
}

function recordStartTime() {
  this._startAt = process.hrtime()
  this._startTime = new Date()
}

logger.express = (opts = {}) => {
  const { immediate, skip } = opts

  return function expressLogger(req, res, next) {
    req._startAt = undefined
    req._startTime = undefined

    // response data
    res._startAt = undefined
    res._startTime = undefined

    // record request start
    recordStartTime.call(req)

    function logRequest() {
      if (Boolean(skip) && skip(req, res)) {
        return
      }

      logger.request(req, res)
    }

    if (immediate) {
      // immediate log
      logRequest()
    } else {
      // record response start
      onHeaders(res, recordStartTime)

      // log when response finished
      onFinished(res, logRequest)
    }

    next()
  }
}

module.exports = logger
