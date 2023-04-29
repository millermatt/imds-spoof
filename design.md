1. imds-spoof-proxy an nginx proxy that runs on a special docker network which handles requests to 169.254.169.254
2. imds-spoof-broker is an http server that handles data requests from the imds-spoof app and calls external programs to get the data to return to the imds-spoof app. external commands must return data in the same format that it will be served by the imds spoof app. imds-data-broker does not format data
3. example-iam-creds-app is called by imds-data-broker to fetch security credentials
4. imds-spoof-ctl manages the docker network, container, and broker

    - IAM
        - /latest/meta-data/iam/security-credentials/ returns a role name
        - /latest/meta-data/iam/security-credentials/<role-name> returns security credentials (access key id, secret, token)
        - /latest/meta-data/iam/info return the instance profile arn
