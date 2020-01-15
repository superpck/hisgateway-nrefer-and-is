var fastifyPlugin = require('fastify-plugin')
var knex = require('knex')

function fastifyKnexJS(fastify, opts, next) {
  try {
    const handler = knex(opts.connection)
    fastify.decorate(opts.connectionName, handler)
    next()
  } catch (err) {
    next(err)
  }
}

module.exports = fastifyPlugin(fastifyKnexJS, '>=0.30.0')
