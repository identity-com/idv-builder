STAGE=${1:-sample}

# Helm can only access files within its chart folder, so copy them here.
cp -r config deploy/kubernetes/idv/config

cd deploy/kubernetes/idv || exit
helm upgrade --install idv-${STAGE} . --namespace idv-${STAGE} -f values.yaml -f values.${STAGE}.yaml --debug --dry-run
