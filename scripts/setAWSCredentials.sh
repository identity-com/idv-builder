# set AWS credentials from env vars into a file if not present

set -e
set -u

AWS_CREDENTIAL_PATH=~/.aws/credentials

mkdir -p ~/.aws

if [ ! -s ${AWS_CREDENTIAL_PATH} ]; then
  echo "Copying AWS credentials to ${AWS_CREDENTIAL_PATH}"
  sudo echo -e "[default]\naws_access_key_id = ${AWS_ACCESS_KEY_ID}\naws_secret_access_key = ${AWS_SECRET_ACCESS_KEY}\n" > /tmp/aws.credentials
  sudo mv /tmp/aws.credentials ${AWS_CREDENTIAL_PATH}
else
  echo "AWS Credentials already exist"
fi
