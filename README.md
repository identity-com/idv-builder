# Overview
The IDV Builder is the easiest way to set-up and run your own [Identity IDV Toolkit](https://www.identity.com/ecosystem/identity-validator-toolkit/) 
and join the [Identity.com](https://www.identity.com) ecosystem. It provides you with an opinionated IDV Toolkit configuration, 
with the goal of minimizing the amount of work needed to launch an IDV Toolkit. Essentially, you only need to implement 
the custom business rules for your IDV and you are ready to launch a production-grade IDV Toolkit.

> **_NOTE:_** We are in the process of Open-Sourcing the IDV Toolkit. The IDV Builder is using the reference implementation 
> by means of requiring pre-build Docker images of the different IDV Toolkit modules.

# Customizing the IDV Builder for your requirements

An IDV Toolkit consists of multiple components, each encapsulating a coherent set of functionality. For example, the 
`SignModule` is responsible for all cryptographic signing: blockchain transactions, certificates, security tokens, etc.
The implementation of these modules, needs to adhere to the Identity.com protocol - it's not expected that an IDV will 
need to customize the reference implementations. With one exception, the `ValidationModule`.

The `ValidationModule`, is the responsible (amongst other things) for:
- describing which information (Name, DoB, etc.) is to be collected from the user. This is done by defining a [Validation Plan](#Validation Plan) 
for each credential type that you want to issue.
- the logic for verifying the collected information, for example by calling an existing service in your application landscape. 
This is done by implementing [Handlers](#Handlers) that validate the information.

Using the IDV Builder, you can focus on customizing solely these two aspects of the ValidationModule.

## Validation Plan

> **_NOTE:_** Validation plans support complex validation flows, such as dynamically requiring additional information, 
>depending on any number of conditions. The documentation for these "advanced" use-cases is still work in progress
and also beyond the scope of the IDV Builder. In this section, we focus on more straight-forward, and common, use-cases._

A validation plan defines what information (in the format of [User Collectable Attributes](https://github.com/identity-com/uca) 
needs to be verified, before a specific credential ([Verifiable Credential](https://github.com/identity-com/credential-commons)) 
is issued.

Store your validation Plans in `ValidationModule/src/plans`. A sample validation plan (`credential-sample-v1.json`) is 
included with the IDV Builder, which collects three pieces of information:
- The user's name
- The user's date of birth and
- The user's current address.
```json
{
 "credential" : "credential-sample-v1",
  "ucaVersion" : "1",
  "ucas" : {
    "name": {
      "name": "cvc:Identity:name",
      "retriesRemaining": 3,
      "parameters": {
        "clientHints": [
          "simplePatch"
        ]
      }
    },
    "dateOfBirth": {
      "name": "cvc:Identity:dateOfBirth",
      "retriesRemaining": 3,
      "parameters": {
        "clientHints": [
          "simplePatch"
        ]
      }
    },
    "address": {
      "name": "cvc:Identity:address",
      "retriesRemaining": 3,
      "parameters": {
        "clientHints": [
          "simplePatch"
        ]
      }
    }
  }
}
```
Here is a closer look at the properties of this example:
- `credential`: Defines which credential this plan is defined for. Its value is the unique credential identifier as it 
has been registered in the Identity.com ontology contract.
- `ucaVersion`: The version of the UCA format used in this plan. You can safely set this to `1`.
- `ucas`: A nested object containing all UCAs that have to be collected from the user.
- `ucas.dateOfBirth`, `ucas.name`, `ucas.address`: An _internal_ name for the UCA to be collected. For example, if a plan 
requires two addresses (e.g. home address and work address) to be collected, then they would have two different internal names, so that they can be referenced separately.
- `ucas.dateOfBirth.name`: The unique name of the UCA to be collected by the client. It must be one of the UCAs defined 
in [here](https://github.com/identity-com/uca/blob/master/src/definitions.js). It is the client's responsibility (e.g. phone, web-app), to customize its UX accordingly. For example, when requesting a birth date (`cvc:Identity:dateOfBirth`), it makes sense for the client to display a date-picker widget. For addresses (`cvc:Identity:address`), a Google Maps integration might make sense.
- `retriesRemaining`: If a user is allowed to correct his entry, after the previous one was rejected, then set a value larger 
than 1. Default is 1.
- `parameters.clientHints`: This meta-information is used by the client (e.g. phone app), to choose a correct way to provide 
the collected information to the IDV Toolkit. The most common hint, `simplePatch` is instructing the client to use a simple PATCH call.

Using these building blocks, different validation plans that suit your needs can be easily defined and be immediately compatible to all clients supporting the Identity.com protocol.

## Handlers

The Validation Module is built around an event architecture. All interaction between the module and the clients, other modules 
or even external services result in events which are processed by built-in or custom event handlers.

This model ensures that an IDV need only implement their custom verification logic in self-contained handlers. However, 
the handlers have access to the state of the entire validation flow, and can therefore be individually as complicated 
as they need to be. 

This approach is inspired by Redux (the handlers are equivalent to Redux Actions and can be processed 
using the reducer pattern) and React (handlers can be represented 'functionally' as pure functions or as classes which 
allow for a separation of the logic for deciding which events to handle and which to ignore).

Thus, a handler is a function of the form:

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

In the IDV Builder, the handlers can be found under (`ValidationModule/src/handlers`).

### Examples

Two sample handlers are included with the IDV Builder (see `simpleUCAHandler.js`):.

The first handler marks a birthdate UCA (`cvc:Identity:dateOfBirth`) as accepted, only if the user is older than 21 years old at the time of execution.
```javascript
class AgeGateUCAHandler extends UCAHandler {
  constructor() {
    super('cvc:Identity:dateOfBirth')
  }
  async handleUCA(value, ucaState) {
    if (value.year < new Date().getFullYear() - 21) {
      ucaState.status = UCAStatus.ACCEPTED;
    } else {
      ucaState.status = UCAStatus.INVALID;
      ucaState.error = new Error('user is underage')
    }
  }
}
```
`AgeGateUCAHandler` extends the `UCAHandler` provided by the [IDV Commons library](https://github.com/identity-com/idv-commons). 
This generic handler takes care of the boilerplate code around receiving UCA values. By passing the name of a UCA as the 
constructor parameter, the `handleUCA` method will be called every time the value of that UCA changes, i.e. when the client 
has provided the requested information. This method can execute any arbitrary code to decide whether to mark the UCA as `ACCEPTED`
or `INVALID`. If you wish to delegate the logic to an existing external, then extending the `Validating Handler` or the `ExternalTaskHandler` from the 
IDV Commons should be used. See the documentation of [IDV Commons](https://github.com/identity-com/idv-commons) for more 
information on those.

The second handler (`AutoPassUCAHandler`) immediately marks a UCA as accepted and doesn't implement any additional logic.

# Configuration

Each component of the IDV is configured by adding JSON files to the config/ folder.

These files are stored as Configmaps and Secrets in Kubernetes and are available to the base IDV toolkit components as well as your
plugin code.

A minimum set of required configuration is detailed in each component's `template.json` file in the config/ folder.
For guidance on how to obtain keys and populate the configuration files, contact Identity.com.

To configure your IDV instance for production:

For each folder in config/
1. Copy template.json to prod.json
2. Copy secrets/template.json to secrets/prod.json (note - this file should not be checked into your repository)
3. Replace the placeholder with values obtained from Identity.com

## Config file load order

Configuration files are loaded in the following order:

- config/defaults.json
- config/<stage>.json
- config/secrets/defaults.json
- config/secrets/<stage>.json

Files lower in the list will overwrite values from files higher in the list.

Additionally, you can override individual values at runtime by setting
 a pod's NODE_CONFIG environment variable to a stringified JSON value.

e.g. to override the admin username for the Admin Interface:

    kubectl set env deployment/admin-interface NODE_CONFIG='{"basicAuth":{"username":"new username"}}'

The IDV uses [node-config](https://www.npmjs.com/package/config) to load config files. More advanced configuration
options can be found in the node-config [documentation](https://github.com/lorenwest/node-config/wiki).

## Secrets

Secrets are stored in config/<component>/secrets/<stage>.json and are copied on deployment to a Kubernetes
Secret resource, rather than a config map.
Files inside the secrets/ folders should not be committed to a repository.

At runtime, inside the components themselves, secrets and other configuration files are merged together and treated identically.

# Running the IDV Builder

## Prerequisites

1. Contact daniel@identity.org for access to the IDV Toolkit ECR repository and configure the IDV Builder to have access.
2. Create a BitGo wallet, fund it and configure the IDV Builder to use that wallet as the Ethereum fee wallet.

## Running locally

To run locally via docker-compose, simply run:

    scripts/start.sh

After the IDV has started, you can call the API directly (without a running Identity.com compatible client), using the 
[Insomnia](https://insomnia.rest/) workspace provided with the IDV Builder (`test/manual/idvBuilderInsomnia.json`).

The BitGo wallet setup is required for creating an attestation. You can instantiate a validation process and test a custom handler 
locally without it.

## Deploying to your Kubernetes Cluster

1. Ensure you have the following infrastructure set up on your cluster:
    - An Ingress Controller
    - A [Storage Class](https://kubernetes.io/docs/concepts/storage/storage-classes) named `standard` (the IDV runs its own internal MongoDB)
    - A namespace named `idv`
3. Rename `deploy/kubernetes/idv/values.template.yaml` to `values.custom.yaml` and edit them to match your Kubernetes configuration.
4. Run `cd deploy/kubernetes/idv & helm install idv . --namespace idv -f values.yaml -f values.custom.yaml` 

## End-to-End Tests

The End-to-End (E2E) tests under `test/e2e` initialize and successfully complete validation flow using the validation plan for the sample credential `credential-sample-v1`.

Run following commands to execute the E2E tests:

```
cd test;
yarn install;
yarn test;
```

The IDV Toolkit will keep running after the tests finish executing. To stop it, run `docker-compose down`.
