#!/bin/bash

CONTAINER=$1
WAIT_SECONDS=120
INTERVAL=5

function check {
  STATUS=$(docker inspect --format "{{json .State.Health }}" ${CONTAINER} | python -c 'import sys, json; print json.load('sys.stdin')["Status"]')

  if [ "$STATUS" = "healthy" ]; then
    return 0
  fi

  return 1
}

while [ ${WAIT_SECONDS} -gt 0 ];
do
  echo "Waiting for ${CONTAINER} to be ready"

  if check; then
    echo "${CONTAINER} ready"
    exit 0;
  fi

  WAIT_SECONDS=$((${WAIT_SECONDS}-${INTERVAL}))
  sleep ${INTERVAL};
done

exit 1

