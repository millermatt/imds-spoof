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

const { execSync } = require('child_process')

module.exports = {
  getContainerNameFromIp,
  getContainerLabels
}

function getContainerNameFromIp(ipAddress, networkName) {
  const network = inspectNetwork(networkName)
  const containerId = Object.keys(network.Containers).find(containerId => network.Containers[containerId].IPv4Address == `${ipAddress}/24`)
  if (containerId) {
    return network.Containers[containerId].Name
  } else {
    console.error(`Could not find container with IP address : ${ipAddress}`)
    return null
  }
}

function getContainerLabels(containerName) {
  if (containerName) {
    const dockerCommand = `docker inspect ${containerName}`
    try {
      const jsonString = execSync(dockerCommand).toString().trim()
      return JSON.parse(jsonString)[0].Config.Labels
    } catch (error) {
      console.error(`Error while running Docker command: ${dockerCommand}`)
      return null
    }
  }
  return null
}

function inspectNetwork(networkName) {
  const dockerCommand = `docker network inspect ${networkName}`
  try {
    const jsonString = execSync(dockerCommand).toString().trim()
    return JSON.parse(jsonString)[0]
  } catch (error) {
    console.error(`Error while running Docker command: ${dockerCommand}`)
    return null
  }
}
