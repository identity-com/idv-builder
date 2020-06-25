# IDV Builder
A repository that makes it easy to set up an IDV on identity.com

## Local testing

To run locally via docker-compose, run:

    scripts/start.sh

This will start the IDV images, exposing a volume in the Validation Module,
which injects a sample plan and sample UCA handler.

