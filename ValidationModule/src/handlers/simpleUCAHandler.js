/* eslint-disable-file no-param-reassign,class-methods-use-this */
const { UCAHandler, Context, Constants: { UCAStatus} } = require('@identity.com/idv-commons');

// a handler that accepts all UCA values
class AutoPassUCAHandler extends UCAHandler {
  constructor(ucaName) {
    super(ucaName, true);
  }
}

// a handler that only accepts users over 21(ish)
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

module.exports = [
  new AutoPassUCAHandler('cvc:Identity:name'),
  new AutoPassUCAHandler('cvc:Identity:address'),
  new AgeGateUCAHandler()
];

// NOOP handler
// module.exports = (state,event) => state
