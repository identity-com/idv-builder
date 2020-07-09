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

# The IDV-Toolkit images are downloaded from the Identity AWS container repository.
# Production AWS account ID is 146055947386. Development AWS account ID is 159876458955.
if [ "$STAGE" = 'prod' ]; then
  IDENTITY_AWS_ACCOUNT_ID='146055947386';
else
  IDENTITY_AWS_ACCOUNT_ID='159876458955';
fi;

DOCKER_REGISTRY="${IDENTITY_AWS_ACCOUNT_ID}".dkr.ecr.us-east-1.amazonaws.com docker-compose pull ${IMAGE}
