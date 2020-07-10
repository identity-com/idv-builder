# for Circleci contexts that include Civic and Identity.com AWS keys,
# ensure the Identity.com ones are used
export AWS_ACCESS_KEY_ID=${IDENTITY_AWS_ACCESS_KEY_ID}
export AWS_SECRET_ACCESS_KEY=${IDENTITY_AWS_SECRET_ACCESS_KEY}
