#!/bin/bash

CONTAINER=$1
WAIT_SECONDS=120
INTERVAL=5

function check {
  echo "SLEEPING 3 SECONDS"
  sleep 3
  return 0
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

