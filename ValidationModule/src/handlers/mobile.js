/* eslint-disable-file no-param-reassign,class-methods-use-this */
const {UCAHandler, Constants: {UCAStatus}} = require('@identity.com/idv-commons');
const {errors: {idvErrors: {IDVErrorCodes}}} = require('@identity.com/credential-commons');
const {SNSClient, PublishCommand} = require("@aws-sdk/client-sns");
const {TokenValidator} = require('../util/token_validator');

class TokenSender extends UCAHandler {
    constructor(client, validatingCredential) {
        super(validatingCredential);
        this.client = client;
    }

    generate_random_code() {
        return (Math.floor(Math.random() * 90000) + 10000).toString();
    }

    async handleUCA(value, ucaMobileState) {
        console.log(`TokenSender received value: ${JSON.stringify(value)}`);
        console.log(`TokenSender ucaMobileState: ${JSON.stringify(ucaMobileState)}`);

        const mobileNumber = `+${value.countryCode}${value.number}`;
        console.log(`Sending verification code to: ${mobileNumber}`);

        // Create the AWS SDK parameters to send the code
        ucaMobileState.token_code = this.generate_random_code();

        const params = {
            Message: `Your Identity verification code is: ${ucaMobileState.token_code}`,
            PhoneNumber: mobileNumber
        };

        await this.client
            .send(new PublishCommand(params))
            .then(verification => {
                console.log(`Verification code successfully delivered with status: ${verification.status}`)
                ucaMobileState.status = UCAStatus.VALIDATING;
            })
            .catch(e => {
                console.error(`Failed to send verification code: ${e}`)
                ucaMobileState.status = UCAStatus.INVALID;
                ucaMobileState.errors = [IDVErrorCodes.ERROR_IDV_TOKEN_SENDING_FAILED];
            });
    }
}

const client = new SNSClient({
    region: 'eu-west-1',
    credentials: {
        accessKeyId: 'AAA', // TODO: Inject dynamically
        secretAccessKey: 'SSS'
    }
});

module.exports = [
    new TokenSender(client, 'cvc:Contact:phoneNumber'),
    new TokenValidator('cvc:Contact:phoneNumber', 'cvc:Verify:phoneNumberToken')
];