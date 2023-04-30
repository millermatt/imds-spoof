const express = require('express')
const app = express()
const pino = require('pino')()
const pinoHttp = require('pino-http')({ logger: pino })
const { getContainerNameFromIp } = require('./docker')

const config = Object.keys(process.env).reduce((accumulator, key) => {
  if (key.startsWith('IMDS_SPOOF_')) {
    accumulator[key] = process.env[key]
  }
  return accumulator
}, {})
pino.info(config)

function restrictByIp(req, res, next) {
  if (req.ip != '169.254.169.254') {
    res.status(403).send('').end()
    req.log.info(`Rejected request from ${req.ip}`)
    return
  }
  next()
}

function addContainerInfo(req, res, next) {
  const realIp = req.headers['x-real-ip']
  const containerName = getContainerNameFromIp(realIp, config.IMDS_SPOOF_NETWORK_NAME)
  req.dockerContainer = { name: containerName, ip: realIp }
  req.log.info(JSON.stringify(req.dockerContainer))
  next()
}


app.use(pinoHttp)
app.use(restrictByIp)
app.use(addContainerInfo)

const port = config.IMDS_SPOOF_BROKER_PORT,
  host = config.IMDS_SPOOF_BROKER_HOST;
app.listen(port, host)
pino.info(`Listening on http://${host}:${port}`)
