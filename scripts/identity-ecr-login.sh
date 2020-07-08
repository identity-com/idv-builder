set -e
set -u

STAGE=${STAGE:-dev}
IDENTITY_AWS_ACCOUNT_ID='159876458955'
IDENTITY_AWS_ROLE="civic-${STAGE}-ecr"
if [ "$STAGE" == 'prod' ]; then IDENTITY_AWS_ACCOUNT_ID='146055947386'; fi

AWS_VERSION=$(aws --version | grep -q aws-cli/2 && echo 2 || echo 1)

echo "Logging into Identity.com ECR"
eval "$(scripts/iamAssumeRole.sh ${IDENTITY_AWS_ROLE} ${IDENTITY_AWS_ACCOUNT_ID})"

if [ $AWS_VERSION -eq 1 ]; then
    # AWS CLI v1
    aws ecr get-login --no-include-email | sh
else
    # AWS CLI v2
    aws ecr get-login-password | docker login \
                                        --username AWS \
                                        --password-stdin "${IDENTITY_AWS_ACCOUNT_ID}".dkr.ecr.us-east-1.amazonaws.com
fi
