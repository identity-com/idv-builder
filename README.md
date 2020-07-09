# IDV Builder
The IDV Builder is the easiest way to set-up and run your own [Identity IDV Toolkit](https://github.com/identity-com/idv-toolkit) for the [Identity.com](https://www.identity.com) ecosystem. 
It provides you with an opinionated IDV Toolkit configuration, with the goal of minimizing the amount of work needed to launch an IDV Toolkit. Essentially, you only need to provide your custom business logic and you are ready to launch 

# Getting Started

## WIP - Prerequisites

1. Contact Identity.com for access to the IDV Toolkit ECR repository.
2. Create a BitGo wallet, fund it and configure the IDV Builder to use that Wallet.

## Running locally

>**_Prerequisite_**: Ensure you have access to the IDV Toolkit ECR repository before proceeding. Contact Identity.com for access.

To run locally via docker-compose, simply run:

    scripts/start.sh

After the IDV has started, you can call the API directly (without a running Identity.com compatible client), using the [Insomnia](https://insomnia.rest/) workspace provided with the IDV Builder (`test/manual/idvBuilderInsomnia.json`).

## Deploying to your Kubernetes Cluster

1. Ensure you have access to the IDV Toolkit ECR repository before proceeding. Contact Identity.com for access.
2. Ensure you have the following infrastructure set up on your cluster:
    - An Ingress Controller
    - A Storage Class named `standard` (needed if the IDV runs its own internal Mongo DB)
    - A namespace named `idv`
3. Rename `deploy/kubernetes/idv/values.template.yaml` to `values.custom.yaml` and edit them to match your Kubernetes configuration.
4. Run `cd deploy/kubernetes/idv & helm install idv . --namespace idv -f values.yaml -f values.custom.yaml`

# Customizing the IDV Builder

> **_NOTE:_** While we have gone to great lengths to abstract away as much complexity as possible, a rudimentary understanding of the architecture of an IDV Toolkit is still helpful. Please consider at least skimming through the
the main IDV Toolkit [Architecture Architecture Guide](https://github.com/identity-com/idv-toolkit/blob/develop/README.md) before diving into the IDV Builder. Additionally, where applicable, we will be linking to specific parts of the main documentation._

An IDV _Toolkit_ consists of [multiple components](https://github.com/identity-com/idv-toolkit/tree/develop/components), each with its own responsibilities. Out of those, the
[Validation Module](https://github.com/identity-com/idv-toolkit/tree/develop/components/modules/ValidationModule) is the one responsible (amongst other things) for:
- describing which information (Name, DoB, etc.) is to be collected from the user. This is done by defining a [Validation Plan](#Validation Plan) for each credential type that you want to issue.
- verifying the collected information, for example by calling an existing service in your application landscape. This is done by implementing [Handlers](#Handlers) that validate the information.

Using the IDV Builder, you can focus on customizing solely these two aspects and have a production-ready IDV Toolkit running in no time.

## Validation Plan

> **_NOTE:_**: Validation plans support complex validation flows, such as dynamically requiring additional information, depending on any number of conditions. The documentation for these "advanced" use-cases is still work in progress
and would also go beyond the scope of the IDV Builder. In this section, we focus on a simpler, and much more common, use-case._ 

A validation plan defines what information (in the format of [User Collectable Attributes](https://github.com/identity-com/uca) needs to be successfully validated, so that a 
a specific credential ([Verifiable Credential](https://github.com/identity-com/credential-commons)) can be issued.

Validation Plans are found in `ValidationModule/src/config/plans`. A sample validation plan (`credential-sample-v1.json`) is included with the IDV Builder, which collects three pieces of information:
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
- `credential`: Defines which credential this plan is to be applied to. Its value is the unique credential identifier as it has been registered in the Identity.com ontology contract.
- `ucaVersion`: The version of the UCA format used in this plan. You can safely set this to `1`.
- `ucas`: A nested object containing all UCAs that have to be collected from the user.
- `ucas.dateOfBirth`, `ucas.name`, `ucas.address`: An _internal_ name for the UCA to be collected. For example, if a plan requires two addresses (e.g. home address and work address) to be collected, then they would have two different internal names, so that they can be referenced separately.
- `ucas.dateOfBirth.name`: The unique name of the UCA to be collected by the client. It must be one of the UCAs defined in [here](https://github.com/identity-com/uca/blob/master/src/definitions.js). It is the client's responsibility (e.g. phone, web-app), to customize its UX accordingly. For example, when requesting a birth date (`cvc:Identity:dateOfBirth`), it makes sense for the client to display a date-picker widget. For addresses (`cvc:Identity:address`), a Google Maps integration might make sense.    
- `retriesRemaining`: If a user is allowed to correct his entry, after the previous one was rejected, then set a value larger than 1. Default is 1.
- `parameters.clientHints`: This meta-information is used by the client (e.g. phone app), to choose a correct way to provide the collected information to the IDV Toolkit. The most common hint, `simplePatch` is instructing the client to use a simple PATCH call. 

Using these building blocks, different validation plans that suit your needs can be easily defined and be immediately compatible to all clients supporting the Identity.com protocol.

## Handlers

Each validation flow (a concrete instance of a validation plan) has its own state, persisted in the database. Every time this state changes, an event is triggered, allowing
[handlers](https://github.com/identity-com/idv-toolkit/tree/develop/components/modules/ValidationModule#handlers) to manipulate this state.  Handlers have access to the state of the entire validation flow, 
and can therefore be individually as complicated as they need to be. In the IDV Builder, the handlers can be found under (`ValidationModule/src/handlers`).
 
This approach is inspired by Redux (the handlers are equivalent to Redux Actions and can be processed using the reducer pattern) and React (handlers can be represented 'functionally' as pure functions or as classes which allow for a separation of the logic for deciding which events to handle and which to ignore).

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
This sample handler extends the generic [UCAHandler](https://github.com/identity-com/idv-commons/blob/ec2e362df89a8ab7a840894162effb66ad5c6ad9/src/vp/Handler.js#L161) - a handler that abstracts a lot of the work around receiving UCA values.
By passing the name of a UCA as the constructor parameter, the `handleUCA` method will be called every time the value of that UCA changes, i.e. when the client has provided the requested information. This method can execute any arbitrary code,
for example calling an external API to decide whether to accept or reject the UCA.  

The second handler (`AutoPassUCAHandler`) immediately marks a UCA as accepted and doesn't implement any additional logic.

## End-to-End Tests

>**_Prerequisite_**: Ensure you have access to the IDV Toolkit ECR repository before proceeding. Contact Identity.com for access.

The End-to-End (E2E) tests under `test/e2e` initialize and successfully complete validation flow using the validation plan for the sample credential `credential-sample-v1`.

Run following commands to execute the E2E tests:

```
cd test;
yarn install;
yarn test;
```

The IDV Toolkit will keep running after the tests finish executing. To stop it, run `docker-compose down`.
