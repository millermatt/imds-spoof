const express = require('express')
const app = express()
const yaml = require('js-yaml')
const fs = require('fs')

let host = '127.0.0.1'
const port = process.env.PORT || 3000

if (process.env.HOST != 'host.docker.internal') {
  host = process.env.HOST
}

let config

function loadConfig() {
  config = yaml.load(fs.readFileSync('/home/matt/repos/millermatt/imds-spoof/.imds-spoof.yaml', 'utf8'))
  console.log(yaml.dump(config))
}

function restrictByIp( req, res, next) {
  if (req.ip != '169.254.169.254') {
    res.status(403).send('').end()
    console.log(`Rejected request from ${req.ip}`)
    return
  }
  next()
}

function logRequest(req, res, next) {
  const realIp = req.headers['x-real-ip']
  console.log(`${realIp} - ${req.method} ${req.url}`)
  next()
}

function reloadConfig(req, res, next) {
  loadConfig()
  res.status(200).send('').end()
}

app.get('/reload', reloadConfig)

app.use(logRequest)
app.use(restrictByIp)

// app.get('/latest/meta-data/iam/security-credentials/', (req, res) => {
//   console.log('got request:', req.path)
//   res.send('my role')
// })

app.use((req, res, next) => {
  const handler = config[req.path]
  if (handler && handler[req.method]) {
    let logText = 'response:'
    handlerConfig = handler[req.method]
    console.log('found handler for', req.method, JSON.stringify(handlerConfig))
    if (typeof handlerConfig.status != 'undefined') {
      res.status(handlerConfig.status)
      logText += ' ' + handlerConfig.status
    }
    if (typeof handlerConfig.body != 'undefined') {
      res.send(handlerConfig.body)
      logText += ' ' + handlerConfig.body
    } else {
      res.send()
    }
    console.log(logText)
  } else {
    res.status(404).send('')
  }
  next()
})

loadConfig()
app.listen(port, host)
console.log(`Listening on http://${host}:${port}`)
