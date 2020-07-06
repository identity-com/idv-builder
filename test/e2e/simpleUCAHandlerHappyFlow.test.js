const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const rp = require('request-promise-native');
const {
  listPlans,
  createValidationProcess,
  getValidationProccess,
  patchUCA,
} = require('./utils');

chai.use(chaiAsPromised);
const { expect } = chai;

const checkForAcceptedUCA = (patchUCAResponse, uca, ucaValue) => {
  expect(patchUCAResponse.statusCode).to.equal(202);
  const { state } = patchUCAResponse.body;
  const ucaData = state.ucas[uca];
  expect(ucaData.status).to.equal('ACCEPTED');
  expect(ucaData.value).to.deep.equal(ucaValue);
};

describe('Simple UCA handler E2E test - Happy Flow', () => {
  it('Should retrieve the plan for the credential-sample-v1 credential', async () => {
    const response = await listPlans();
    expect(response.statusCode).to.equal(200);
    expect(response.body.data).to.include('credential-sample-v1');
  });

  context('Success validation', () => {
    let processId;
    const userId = 'myUserId';

    step('1. Create validation process', async () => {
      const response = await createValidationProcess('credential-sample-v1', userId);
      expect(response.statusCode).to.equal(201);
      const { state, id } = response.body;
      processId = id;
      expect(state.credential).to.equal('credential-sample-v1');
      expect(state.status).to.equal('IN_PROGRESS');
    });

    step('2. Submit the name UCA', async () => {
      const nameValue = {
        givenNames: 'Test',
        familyNames: 'User',
      };
      const response = await patchUCA(processId, userId, 'name', nameValue);
      checkForAcceptedUCA(response, 'name', nameValue);
    });

    step('3. Submit the date of birth UCA', async () => {
      const dateOfBirthValue = {
        year: 1990,
		    month: 1,
		    day: 1,
      };
      const response = await patchUCA(processId, userId, 'dateOfBirth', dateOfBirthValue);
      checkForAcceptedUCA(response, 'dateOfBirth', dateOfBirthValue);
    });

    step('4. Submit the address UCA', async () => {
      const addressValue = {
		    street: '123 NW 101ST ST',
		    unit: '1st Floor',
		    city: 'Somewhere',
		    state: 'NY',
		    postalCode: '11111-1111',
		    country: 'US',
      };
      const response = await patchUCA(processId, userId, 'address', addressValue);
      checkForAcceptedUCA(response, 'address', addressValue);
      // validation process status should be COMPLETE after submitting all UCAs
      expect(response.body.state.status).to.equal('COMPLETE');
    });

    step('5. Confirm validation process is complete', async () => {
      const response = await getValidationProccess(processId, userId);
      expect(response.body.state.status).to.equal('COMPLETE');
    });
  });
});
