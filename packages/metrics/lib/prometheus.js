const { addToExpress } = require('./handlers')
const client = require('prom-client')

const prometheus = { ...client }
const defaultPrefix = process.env.APP || 'unknown_app_'

prometheus.init = (opts = {}) => {
  const prefixFromName = opts.name ? opts.name + '_' : ''
  const prefix = opts.prefix || prefixFromName || defaultPrefix

  return {
    metricsInterval: client.collectDefaultMetrics({ prefix })
  }
}

const { Counter, register } = client

prometheus.register = register
prometheus.addToExpress = router => addToExpress(register, router)

const counters = {}
const helps = {}

prometheus.help = (key, help) => {
  helps[key] = help
}

prometheus.incr = (key, value) => {
  if (!counters[key]) {
    const help = helps[key] || key + '_help'
    counters[key] = new Counter({ name: key, help })
  }

  counters[key].inc(value)
}

module.exports = prometheus
