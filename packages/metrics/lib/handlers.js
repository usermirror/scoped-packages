function addToExpress(register, router) {
  router.get('/metrics', (_, res) => {
    res.set('Content-Type', register.contentType)
    res.end(register.metrics())
  })
}

function addToMicro(req, res) {
  // TODO: add to `zeit/micro` router
}

module.exports = {
  addToExpress
}
