#!/bin/bash
#
# Initialize the Idv with the Validation module plugin injected
#
# Usage:
# STAGE=dev DETACHED=true ./scripts/start.sh

STAGE=${STAGE:-dev};
TAG=${TAG:-latest}

DETACHED=${DETACHED-true};
DOCKER_COMPOSE_PARAMS='';

if [ "$DETACHED" = true ]; then
  DOCKER_COMPOSE_PARAMS='-d';
fi

if [ "$STAGE" = 'prod' ]; then
    DOCKER_REGISTRY='146055947386.dkr.ecr.us-east-1.amazonaws.com';
else
    DOCKER_REGISTRY='159876458955.dkr.ecr.us-east-1.amazonaws.com';
fi;

DOCKER_REGISTRY=${DOCKER_REGISTRY} \
    TAG=${TAG} \
    CONFIG_OVERRIDE=$(scripts/configToString.sh) \
    docker-compose up $DOCKER_COMPOSE_PARAMS
