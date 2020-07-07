# IDV Builder
A repository that makes it easy to set up an IDV on identity.com.

The IDV Builder has a sample implementation of a Validation Module as a plugin for the [Identity IDV Toolkit](https://github.com/identity-com/idv-toolkit).
The Validation Module has the business logic around validating PII and producing Verifiable Credentials (VCs).

The Validation Module is built around an event architecture. All interaction between the module and the mobile user,
the Credential Module or external services results in events which are processed by built-in or custom handlers.

## Handlers

Each validation flow has its own state, persisted in the database. This state can be manipulated by the event handlers.

This model ensures that the IDV need only implement the handlers in order to integrate their systems with the
IDV toolkit. However, the handlers have access to the state of the entire validation flow, and can therefore
be individually as complicated as they need to be.

Event handlers come in two forms:

- Internal: Provided by the IDV Toolkit - handle non-custom processes like responding to events from the credential module
- Custom: Injected by the IDV - handle integration with IDV services

Custom event handlers can be injected via a config file.

```json
{
    "handlers": [
      "src/plugins/handlers",
      "custom-handler-module"
    ]
}
```
In the above example, handlers will be imported from the src/plugins/handlers directory and the
custom-handler-module npm module (Note: currently only importing from directories is implemented).

A handler is a function of the form:

```
handle = (state, event) => state
```

or:

```
handle = (state, event) => promise(state)
```

Alternatively, the handler can be an object which responds to two methods:

```
class Handler {
    canHandle(Event) : Boolean
    handle(State, Event) : State
}
```

This approach is inspired by Redux (the handlers are equivalent to Redux Actions and can be processed using the reducer pattern) and React (handlers can be represented 'functionally' as pure functions or as classes which allow for a separation of the logic for deciding which events to handle and which to ignore).

Custom handlers will typically handle events of type: 'UCA_RECEIVED'. This event contains an array of UCAs and is triggered whenever the user responds to the IDV's request for user information. A simple example of a handler of this sort may be (pseudocode):

```
const triggerSMSTokenSendHandler = (state, event) => {
  // if event is of type UCA_RECEIVED and contains a mobile phone UCA
  // generate an SMS token and store it in the state as 'expected token'
  // trigger an external service to send this token to the mobile phone in the UCA
}
 and a subsequent handler would be:

const smsTokenHandler = (state, event) => {
  // if event is of type UCA_RECEIVED and contains an SMS Token UCA
  // look up the 'expected token' field in the state
  // if it is equal to the token in the UCA, mark the mobile phone UCA in the state as 'validated'
  // else add an error to the state
}
```

A Handler can extend the UCAHandler in order to add additional verification of the uca value and uca version
according to the UCA definitions in the identity.com [UCA library](https://github.com/identity-com/uca).

The ucaVersion is set at the top level of a plan, and defined in the UCAHandler constructor. The default is '1'.

## Configuration

The configuration in the back-end is loaded by feathers. It reads the configuration from
`${NODE_CONFIG_DIR}`, which is set in docker-compose to `/opt/app/config/config/validationmodule`.

`${NODE_CONFIG_DIR}/default.js` loads the default config and merges it with the secrets.

Feathers then also loads in config from `${NODE_CONFIG_DIR}/${NODE_ENV}.js`

where `NODE_ENV` is also set in docker-compose.

## Sample handler

The Idv-builder implements a sample handler for reference.

A plan for a _credential-sample-v1_ credential is defined in _ValidationModule/src/config/plans/credential-sample-v1.json_.
The plan lists all the required UCAs: _name_, _dateOfBirth_ and _address_.

A simple handler is defined in _ValidationModule/src/handlers/simpleUCAHandler.js_.

The _AutoPassUCAHandler_ handler just extends the _UCAHandler_. It does not implement any additional logic.

The UCAHandler is an ancestral handler that already implements the _canHandle_ logic, checking the event type and if the event payload has a valid UCA (user collectible attribute) that matches the handler. For more information about the _UCAHandler_ and all ancestral handlers, check the Idv-commons documentation [add link].

The _AgeGateUCAHandler_ handler has a custom logic for validating if the user is over 21(ish) based on the provided date of birth.
It changes the UCA state in its custom _handleUCA_ implementation (the UCA status is set to ACCEPTED or INVALID).

## Local testing

To run locally via docker-compose, run:

    scripts/start.sh

This will start the IDV images, exposing a volume in the Validation Module,
which injects a sample plan and sample UCA handler.

## E2E Tests

The E2E tests in _test/e2e_ runs a validation process by executing the steps defined in the plan for the _credential-sample-v1_ credential type. This test ensures the sample handler is properly injected and works for a simple validation.

The test command initializes the Idv with the Validation module injected and waits for the validation module to be ready.

Ensure you have access to the IDV Toolkit ECR repository before proceeding.

The following commands execute the E2E tests:
```
cd test;
yarn install;
yarn test;
```
The Idv will keep running after the tests finish executing.
To stop Idv, run `docker-compose down`;

## Manual Tests

The Idv-builder can be manually tested using [Insomnia](https://insomnia.rest/) API client.
Import the workspace from _test/manual/idvBuilderInsomnia.json_ into Insomnia and run the requests against a local running application.

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
