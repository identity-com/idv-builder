#!/bin/bash
#
# Initialize the Idv with the Validation module plugin injected.
# Wait for the Idv to be ready.
#
# Usage:
# STAGE=dev ./scripts/startIdv.sh

STAGE=${STAGE:-dev}
TAG=${TAG:-latest}

TEST_PATH=$(pwd);
IDV_HEALTH_CHECK_URL='http://localhost:6060/health';

# initialize Idv
cd ../;
printf '\nStarting Idv...\n';
STAGE=${STAGE} TAG=${TAG} . scripts/start.sh;
cd ${TEST_PATH};

# wait for application to be ready
printf '\nWaiting for Idv to be ready';
until $(curl --output /dev/null --silent --head --fail ${IDV_HEALTH_CHECK_URL}); do
  printf '.';
  sleep 5;
done

printf '\nIdv is ready!\n';
