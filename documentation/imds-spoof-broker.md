# imds-spoof-broker

The broker is a nodejs/express app that

1. receives imds requests from the proxy
2. looks up the name of the Docker container that initiated the request
3. calls an external program to get response data
4. responds to the request with the data from the external program

# Design

The broker calls the external app and passes 2 parameters:

- The name of the Docker container that iniated the request
- A base64 encoded JSON string that represents the IMDS request. By using base64 we can avoid quoting problems in the parameters.

The JSON string passed to the external program includes:
- The HTTP method of the request: `.method`
- The path of the request: `.path`
- The request headers: `.headers`
- The request body if there is one: `.body`

The broker expects that the external program will return data to as a base64 encoded JSON string that represents an HTTP response. The external app should write only the base64 string to its stdout.

The JSON string passed back to the broker from the external program should include:
- The HTTP response numeric status: `.status`
- Response headers: `.headers`
- A response body: `.body`

The broker will then respond to the imds-spoof-proxy request with the response values from the external program.
