#!/bin/bash

set -e

if [ "$ENV" = "TEST" ]
    then
    echo "running Test"
else
    echo "running Production"
    exec npm start
fi