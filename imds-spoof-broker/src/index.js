const express = require('express')
const app = express()

let host = '127.0.0.1'
const port = process.env.PORT || 3000

if (process.env.HOST != 'host.docker.internal') {
  host = process.env.HOST
}

app.get('/', (req, res) => {
  console.log('got request:', req.path)
  res.send('Hello World')
})

app.listen(port, host)
console.log(`Listening on http://${host}:${port}`)
