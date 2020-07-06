#!/usr/bin/env bash

TEST_PATH=$(pwd);

# initialize Idv
cd ../;
printf '\nStarting Idv...\n';
DOCKER_REGISTRY=159876458955.dkr.ecr.us-east-1.amazonaws.com \
  CONFIG_OVERRIDE=$(scripts/configToString.sh) \
  docker-compose up -d
cd ${TEST_PATH};

# wait for application to be ready
IDV_HEALTH_CHECK_URL='http://localhost:6060/health';
printf '\nWaiting for Idv to be ready';
until $(curl --output /dev/null --silent --head --fail ${IDV_HEALTH_CHECK_URL}); do
  printf '.';
  sleep 5;
done

printf '\nIdv is ready!\n'
