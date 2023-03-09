const {UCAHandler, Constants: {UCAStatus}, Utilities: {findUCAByName}} = require('@identity.com/idv-commons');

class TokenValidator extends UCAHandler {
    constructor(validatingCredential, tokenCredential) {
        super(tokenCredential);
        this.validatingCredential = validatingCredential;
    }

    async handleUCA(value, ucaMobileTokenState, processState) {
        console.log(`TokenValidator received value: ${JSON.stringify(value)}`);
        console.log(`TokenValidator ucaState: ${JSON.stringify(ucaMobileTokenState)}`);
        const ucaMobileState = findUCAByName(processState, this.validatingCredential);
        const tokenValid = ucaMobileState.token_code === ucaMobileTokenState.value;
        const nextState = tokenValid ? UCAStatus.ACCEPTED : UCAStatus.INVALID;
        ucaMobileTokenState.status = nextState;
        ucaMobileState.status = nextState;
    }
}

module.exports = {
    TokenValidator
};