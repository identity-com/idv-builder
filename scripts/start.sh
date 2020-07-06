DOCKER_REGISTRY=159876458955.dkr.ecr.us-east-1.amazonaws.com \
  CONFIG_OVERRIDE=$(scripts/configToString.sh) \
  docker-compose up
