#!/bin/bash
#
# Assume the given role, and print out a set of environment variables
# for use with aws cli.
#
# To use:
#
#      $ eval $(./iam-assume-role.sh ROLE ACCOUNT DURATION)
#

set -e
set -u

ROLE="${1}"
ACCOUNT="${2}"
DURATION="${3:-900}"  # default to 15 minutes
NAME="${4:-$LOGNAME@`hostname -s`}" # default to username@hostname

# KST=access*K*ey, *S*ecretkey, session*T*oken
KST=(`aws sts assume-role --role-arn "arn:aws:iam::$ACCOUNT:role/$ROLE" \
                          --role-session-name "$NAME" \
                          --duration-seconds $DURATION \
                          --query '[Credentials.AccessKeyId,Credentials.SecretAccessKey,Credentials.SessionToken]' \
                          --output text`)

echo 'export AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-us-east-1}'
echo "export AWS_ACCESS_KEY_ID='${KST[0]}'"
echo "export AWS_ACCESS_KEY='${KST[0]}'"
echo "export AWS_SECRET_ACCESS_KEY='${KST[1]}'"
echo "export AWS_SECRET_KEY='${KST[1]}'"
echo "export AWS_SESSION_TOKEN='${KST[2]}'"      # older var seems to work the same way
echo "export AWS_SECURITY_TOKEN='${KST[2]}'"
echo "export AWS_DELEGATION_TOKEN='${KST[2]}'"
