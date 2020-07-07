#!/usr/bin/env bash
#
# Initialize the Idv with the Validation module plugin injected
#
# Usage:
# ./scripts/start.sh

DETACHED=true;
DOCKER_COMPOSE_PARAMS='';

if [ "$DETACHED" = true ]; then
  DOCKER_COMPOSE_PARAMS='-d';
fi

DOCKER_REGISTRY=146055947386.dkr.ecr.us-east-1.amazonaws.com \
  TAG=2.0.1 \
  CONFIG_OVERRIDE=$(scripts/configToString.sh) \
  docker-compose up $DOCKER_COMPOSE_PARAMS
