set -e
set -u

STAGE=${STAGE:-dev}

# The IDV-Toolkit images are downloaded from the Identity AWS container repository.
# Production AWS account ID is 146055947386. Development AWS account ID is 159876458955.
# To access it, it is required to assume the civic-prod-ecr role (for prod) or the
# civic-dev-ecr (for dev) role.
IDENTITY_AWS_ROLE="civic-${STAGE}-ecr";

if [ "$STAGE" = 'prod' ]; then
  IDENTITY_AWS_ACCOUNT_ID='146055947386';
else
  IDENTITY_AWS_ACCOUNT_ID='159876458955';
fi;

AWS_VERSION=$(aws --version | grep -q aws-cli/2 && echo 2 || echo 1)

# If this script is not run with AWS credentials from the identity.com AWS
# attempt to assume a role on the identity.com AWS account.
# The AWS account and user must have permissions to access the identity.com account.
ACCOUNT_ID=$(aws sts get-caller-identity --output text --query 'Account')
if [ $ACCOUNT_ID != IDENTITY_AWS_ACCOUNT-ID ]; then
  echo "Logging into Identity.com ECR"
  eval "$(scripts/iamAssumeRole.sh ${IDENTITY_AWS_ROLE} ${IDENTITY_AWS_ACCOUNT_ID})"
fi

if [ $AWS_VERSION -eq 1 ]; then
  # AWS CLI v1
  aws ecr get-login --no-include-email | sh
else
  # AWS CLI v2
  aws ecr get-login-password | docker login \
    --username AWS \
    --password-stdin "${IDENTITY_AWS_ACCOUNT_ID}".dkr.ecr.us-east-1.amazonaws.com
fi
