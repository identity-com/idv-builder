#!/usr/bin/env bash
#
# Initialize the Idv with the Validation module plugin injected.
# Wait for the Idv to be ready.
#
# Usage:
# ./scripts/startIdv.sh

IDV_HEALTH_CHECK_URL='http://localhost:6060/health';
TEST_PATH=$(pwd);

# initialize Idv
cd ../;
printf '\nStarting Idv...\n';
./scripts/start.sh;
cd ${TEST_PATH};

# wait for application to be ready
printf '\nWaiting for Idv to be ready';
until $(curl --output /dev/null --silent --head --fail ${IDV_HEALTH_CHECK_URL}); do
  printf '.';
  sleep 5;
done

printf '\nIdv is ready!\n';
