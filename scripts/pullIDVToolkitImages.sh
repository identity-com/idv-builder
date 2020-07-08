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

. scripts/identity-ecr-login.sh

docker-compose pull ${IMAGE}
