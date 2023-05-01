# Commands

## start

`imds-spoof-ctl start`

Creates the Docker network and proxy container, and starts the broker.

## stop

`imds-spoof-ctl stop`

Removes the Docker network and proxy container, and stops the broker.

The Docker network cannot be removed if any other containers are connected to it.

## restart-broker

`imds-spoof-ctl restart-broker`

Stops and starts the broker.