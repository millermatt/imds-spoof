/*
 * Copyright 2023 Matt Miller https://github.com/millermatt
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const pino = require('pino')({ level: process.env.LOG_LEVEL || 'info' })
const pinoHttp = require('pino-http')({ logger: pino, autoLogging: false })
const { getContainerNameFromIp, getContainerLabels } = require('./docker')
const { execSync } = require('child_process');


const config = Object.keys(process.env).reduce((accumulator, key) => {
  if (key.startsWith('IMDS_SPOOF_')) {
    accumulator[key] = process.env[key]
  }
  return accumulator
}, {})
pino.info(config)

function restrictByIp(req, res, next) {
  if (req.ip != '169.254.169.254' && req.ip != '127.0.0.1') {
    res.status(403).send('').end()
    req.log.info(`Rejected request from ${req.ip}`)
    return
  }
  next()
}

/*
this function calls an external command and processes the output of the command

the external command should accept 2 parameters:
1. name of the docker container that originated the request
2. a base 64 encoded string, which, when decoded represents the http request. it has these properties:
    - .method (http method)
    - .path
    - .headers
    - .body (if the request had a body)

the external command should send back a response by printing to stdout. what it prints should
be a base64 encoded string, which, when decoded results in a json string that has these properties:
    - .status (http status code)
    - .headers
    - .body (optional)

these props will be set on the express js response object sent back to the docker container
*/
function broker(req, res, next) {
  const realIp = req.headers['x-real-ip']
  let containerName
  let containerLabels

  try {
    containerName = getContainerNameFromIp(realIp, config.IMDS_SPOOF_PROXY_DOCKER_NETWORK_NAME)
    containerLabels = getContainerLabels(containerName)
  } catch (e) {
    console.error(e)
    return e
  }

  // create a request object to send to the external program
  const partialRequest = {
    method: req.method,
    path: req.path,
    headers: req.headers,
    containerName,
    containerLabels
  }

  if (req.body) {
    partialRequest.body = req.body
  }

  const base64request = Buffer.from(JSON.stringify(partialRequest)).toString('base64')
  let output = ''

  try {
    // Execute the external program with parameters and capture its stdout, stderr, and exit code
    const output = execSync(`${config.IMDS_SPOOF_BROKER_EXTERNAL_COMMAND} ${containerName} ${base64request}`, { encoding: 'utf8' });

  } catch (error) {
    // Output the captured stderr and exit code
    req.log.error(error.stderr);
    req.log.error(`Exit code: ${error.status}`);
  }

  // // Output the captured stdout
  // req.log.debug(output)

  // parse output as json and set similar response props
  const decodedOutput = decodeBase64(output)
  if (decodedOutput == null) {
    req.log.error('Received non-base64 response from external command')
    res.status(500).send('').end()
  } else {
    const externalResponse = JSON.parse(decodedOutput)
    if (typeof externalResponse.status != 'undefined') {
      res.status(externalResponse.status)
    }
    if (typeof externalResponse.headers != 'undefined') {
      res.headers = {
        ...res.headers,
        ...externalResponse.headers
      }
    }
    if (typeof externalResponse.body != 'undefined') {
      res.send(externalResponse.body)
    }
    res.end()
  }

}

function decodeBase64(str) {
  try {
    // Attempt to decode the string using base64 encoding
    const decoded = Buffer.from(str, 'base64').toString('utf-8');

    if (decoded == str) {
      return null
    }
    return decoded;
  } catch (e) {
    // Catch any errors from attempting to decode the string
    return null;
  }
}

app.use(pinoHttp)
app.use(bodyParser.text())
app.use(restrictByIp)
app.use(broker)

const port = config.IMDS_SPOOF_BROKER_PORT,
  host = config.IMDS_SPOOF_BROKER_HOST;
app.listen(port, host)
pino.info(`Listening on http://${host}:${port}`)
