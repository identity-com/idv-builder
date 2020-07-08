# Load idv-toolkit images for building civic plugin images
#
# Usage
#
# STAGE=dev/prod pullIDVToolkitImages.sh [tag] [image]
#
# e.g.
# STAGE=dev pullIDVToolkitImages.sh stable validation-module
#
# or pull all latest images
#
# STAGE=dev pullIDVToolkitImages.sh

set -e
set -u

export TAG=${1:-latest}
IMAGE=${2:-}
STAGE=${STAGE:-dev}

STAGE=${STAGE} . scripts/identity-ecr-login.sh

if [ "$STAGE" = 'prod' ]; then
  DOCKER_REGISTRY='146055947386.dkr.ecr.us-east-1.amazonaws.com';
else
  DOCKER_REGISTRY='159876458955.dkr.ecr.us-east-1.amazonaws.com';
fi;

DOCKER_REGISTRY=${DOCKER_REGISTRY} docker-compose pull ${IMAGE}
