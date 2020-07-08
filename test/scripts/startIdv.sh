#!/bin/bash
#
# Initialize the Idv with the Validation module plugin injected.
# Wait for the Idv to be ready.
#
# Usage:
# STAGE=dev ./scripts/startIdv.sh

STAGE=${STAGE:-dev};
TAG=${TAG:-latest};

TEST_PATH=$(pwd);

# the validation-module typically takes the longest time to start up
CONTAINER_TO_WAIT_FOR='validation-module';

# initialize Idv
cd ../;
printf '\nStarting Idv...\n';
STAGE=${STAGE} TAG=${TAG} . scripts/start.sh;
cd ${TEST_PATH};

# wait for application to be ready
scripts/waitForContainer.sh ${CONTAINER_TO_WAIT_FOR}
