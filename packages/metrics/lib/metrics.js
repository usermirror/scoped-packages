const { addToExpress } = require('./handlers')
const client = require('prom-client')

const metrics = { ...client }
const defaultPrefix = process.env.APP || 'unknown_app_'

let incrPrefix

metrics.init = (opts = {}) => {
  const prefixFromName = opts.name ? opts.name + '_' : ''
  const prefix = opts.prefix || prefixFromName || defaultPrefix

  if (prefix) {
    incrPrefix = prefix
  }

  return {
    metricsInterval: client.collectDefaultMetrics({ prefix })
  }
}

const { Counter, register } = client

metrics.register = register
metrics.addToExpress = router => addToExpress(register, router)

const counters = {}
const helps = {}

metrics.help = (key, help) => {
  helps[key] = help
}

metrics.incr = (key, value, tags) => {
  if (typeof value !== Number) {
    tags = value
  }

  const help = getHelpForKey(key)

  if (incrPrefix) {
    key = incrPrefix + key
  }

  if (!counters[key]) {
    const labelNames = Object.keys(tags || {})
    const name = key

    counters[key] = new Counter({ name, help, labelNames })
  }

  counters[key].inc(value)
}

function getHelpForKey(key) {
  return helps[key] || key + '_help'
}

module.exports = metrics
