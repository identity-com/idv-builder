const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const rp = require('request-promise-native');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('Simple UCA handler E2E test', () => {
  it('test', async () => {
    expect(1+1).to.eq(2);
  });

  it('Create a new validation process', async () => {
    const validationProcess = await rp({
      url: 'http://localhost:6060/processes',
      method: 'POST',
      body: {
        credentialItemType: 'credential-sample-v1',
        userId: 'testUser'
      },
      json: true,
      resolveWithFullResponse: true,
    });
    console.log(validationProcess);
  });
});