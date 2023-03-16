const fetch = require('node-fetch');
const {UCAHandler, Constants: {UCAStatus}, Utilities: {findUCAByName}} = require('@identity.com/idv-commons');

class AutoAccept extends UCAHandler {
    constructor(credentialName) {
        super(credentialName);
    }

    async handleUCA(value, ucaState) {
        console.log(`Auto accepting credential: ${ucaState}`);
        ucaState.status = UCAStatus.ACCEPTED;
    }
}

class SocureEmailValidator extends UCAHandler {
    constructor(socureEndpoint,
                socureAuthToken,
                emailUcaId,
                nameUcaId,
                countryUcaId) {
        super(emailUcaId);
        this.nameUcaId = nameUcaId;
        this.countryUcaId = countryUcaId;
        this.socureEndpoint = socureEndpoint;
        this.socureAuthToken = socureAuthToken;
    }

    async handleUCA(value, emailUCA, processState) {
        console.log(`Evaluating credential: ${JSON.stringify(emailUCA)}`);

        const nameUca = findUCAByName(processState, this.nameUcaId);
        const countryUca = findUCAByName(processState, this.countryUcaId);

        const payload = {
            'modules': ['emailrisk'],
            'firstName': nameUca.value.givenNames,
            'surName': nameUca.value.familyNames,
            'email': emailUCA.value,
            'country': countryUca.value
        };

        console.log(`Posting validation: ${JSON.stringify(payload)}`);

        const response = await fetch(this.socureEndpoint, {
            method: 'post',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `SocureApiKey ${this.socureAuthToken}`
            }
        });

        const data = await response.json();

        console.log(`Received response code from Socure: [${response.status}] and data: [${JSON.stringify(data)}]`)

        if (response.status === 200 && data['emailRisk']['score'] <= 0.1) {
            emailUCA.status = UCAStatus.ACCEPTED;
        } else {
            emailUCA.status = UCAStatus.INVALID;
        }
    }
}

const socureEndpoint = 'https://sandbox.socure.com/api/3.0/EmailAuthScore';
const socureAuthToken = 'SSS'; // TODO: Inject dynamically

module.exports = [
    new SocureEmailValidator(socureEndpoint, socureAuthToken, 'cvc:Email:username', 'cvc:Type:Name', 'cvc:Type:country'),
    new AutoAccept('cvc:Type:Name'),
    new AutoAccept('cvc:Type:country'),
];