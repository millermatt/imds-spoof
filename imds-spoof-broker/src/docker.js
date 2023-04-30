const { execSync } = require('child_process')

module.exports = {
  getContainerNameFromIp
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
