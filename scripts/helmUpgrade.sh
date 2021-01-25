STAGE=${1:-sample}

# Helm can only access files within its chart folder, so copy them here.
rm -rf deploy/kubernetes/idv/config
cp -r config deploy/kubernetes/idv/config

export MONGODB_ROOT_PASSWORD=$(kubectl get secret --namespace ${NAMESPACE} mongodb -o jsonpath="{.data.mongodb-root-password}" | base64 --decode)


cd deploy/kubernetes/idv || exit
helm upgrade --install ${RELEASE} . --namespace ${NAMESPACE} -f values.yaml -f values.${STAGE}.yaml --set mongodb.auth.rootPassword=$MONGODB_ROOT_PASSWORD --debug
