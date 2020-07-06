# IDV Builder
A repository that makes it easy to set up an IDV on identity.com

## Local testing

To run locally via docker-compose, run:

    scripts/start.sh

This will start the IDV images, exposing a volume in the Validation Module,
which injects a sample plan and sample UCA handler.

## E2E Tests

The E2E tests in `test/e2e` runs a validation process by executing the steps defined in the plan for the `credential-sample-v1` credential type. This test ensures the sample handler is properly injected and works for a simple validation.

The test command initializes the Idv with the Validation module injected and waits for the validation module to be ready.

Ensure you have access to the IDV Toolkit ECR repository before proceeding.

The following commands execute the E2E tests:
```
cd test;
yarn install;
yarn test;
```

## Deploy to Kubernetes

1. Contact identity.com for access to the IDV Toolkit ECR repository
2. Ensure you have the following infrastructure set up on your cluster:
    - An Ingress Controller
    - A Storage Class named "standard" (needed if the IDV runs its own internal Mongo DB)
    - A namespace called "idv"
3. Copy values.template.yaml to values.custom.yaml and edit them to match your requirements
4. Run
    cd deploy/kubernetes/idv
    helm install idv . --namespace idv -f values.yaml -f values.custom.yaml
