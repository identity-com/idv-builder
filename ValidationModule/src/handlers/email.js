/* eslint-disable-file no-param-reassign,class-methods-use-this */
const {UCAHandler, Constants: {UCAStatus}} = require('@identity.com/idv-commons');
const {errors: {idvErrors: {IDVErrorCodes}}} = require('@identity.com/credential-commons');
const {SESClient, SendEmailCommand} = require("@aws-sdk/client-ses");
const {TokenValidator} = require("../util/token_validator");

class TokenSender extends UCAHandler {
    constructor(client, validatingCredential, sourceAddress) {
        super(validatingCredential)
        this.client = client;
        this.sourceAddress = sourceAddress;
    }

    generate_random_code() {
        return (Math.floor(Math.random() * 90000) + 10000).toString();
    }

    async handleUCA(emailUCA, ucaEmailState) {
        console.log(`TokenSender received emailUCA: ${JSON.stringify(emailUCA)}`);
        console.log(`TokenSender ucaEmailState: ${JSON.stringify(ucaEmailState)}`);

        // Extract the destination email address
        const destination = `${emailUCA.username}@${emailUCA.domain.name}.${emailUCA.domain.tld}`;
        console.log(`Sending verification code to: ${destination}`);

        // Apply a unique code
        ucaEmailState.token_code = this.generate_random_code();

        // Prepare the parameters required to send a validation email
        const params = {
            Destination: {
                ToAddresses: [destination]
            },
            Message: {
                Body: {
                    Text: {
                        Data: `Your Identity verification code is: ${ucaEmailState.token_code}`
                    }
                },
                Subject: {
                    Data: 'Identity Verification Code'
                }
            },
            Source: this.sourceAddress
        };

        await this.client
            .send(new SendEmailCommand(params))
            .then(verification => {
                console.log(`Verification code successfully delivered with status: ${verification.status}`)
                ucaEmailState.status = UCAStatus.VALIDATING;
            })
            .catch(e => {
                console.error(`Failed to send verification code: ${e}`)
                ucaEmailState.status = UCAStatus.INVALID;
                ucaEmailState.errors = [IDVErrorCodes.ERROR_IDV_TOKEN_SENDING_FAILED];
            });
    }
}

const sourceAddress = 'verification@identity.com'; // TODO: Define
const client = new SESClient({
    region: 'eu-west-1',
    credentials: {
        accessKeyId: 'AAA',  // TODO: Inject dynamically
        secretAccessKey: 'SSS'
    }
});

module.exports = [
    new TokenSender(client, 'cvc:Contact:email', sourceAddress),
    new TokenValidator('cvc:Contact:email', 'cvc:Verify:emailToken')
];