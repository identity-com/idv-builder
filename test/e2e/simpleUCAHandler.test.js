const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const rp = require('request-promise-native');

chai.use(chaiAsPromised);
const { expect } = chai;

const validationModuleUrl = process.env.IDV_HOST || 'http://localhost:6060';

const listPlans = async () => rp({
  url: `${validationModuleUrl}/plans`,
  method: 'GET',
  json: true,
  resolveWithFullResponse: true,
});

const createValidationProcess = async (credentialItemType, userId) => rp({
  url: `${validationModuleUrl}/processes`,
  method: 'POST',
  body: { credentialItemType, userId },
  json: true,
  resolveWithFullResponse: true,
});

const getValidationProccess = async (processId, userId) => rp({
  url: `${validationModuleUrl}/processes/${processId}`,
  method: 'GET',
  headers: { user_id: userId },
  json: true,
  resolveWithFullResponse: true,
});

const patchUca = async (processId, userId, uca, value) => rp({
  url: `${validationModuleUrl}/processes/${processId}/ucas/${uca}`,
  method: 'PATCH',
  body: { value },
  headers: { user_id: userId },
  json: true,
  resolveWithFullResponse: true,
});

const checkForAcceptedUCA = (patchUcaResponse, uca, ucaValue) => {
  expect(patchUcaResponse.statusCode).to.equal(202);
  const { state } = patchUcaResponse.body;
  const ucaData = state.ucas[uca];
  expect(ucaData.status).to.equal('ACCEPTED');
  expect(ucaData.value).to.deep.equal(ucaValue);
};

describe('Simple UCA handler E2E test', () => {
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

    step('2. Submit the email UCA', async () => {
      const nameValue = {
        givenNames: 'Test',
        familyNames: 'User',
      };
      const response = await patchUca(processId, userId, 'name', nameValue);
      checkForAcceptedUCA(response, 'name', nameValue);
    });

    step('3. Submit the date of birth UCA', async () => {
      const dateOfBirthValue = {
        year: 1988,
		    month: 6,
		    day: 9,
      };
      const response = await patchUca(processId, userId, 'dateOfBirth', dateOfBirthValue);
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
      const response = await patchUca(processId, userId, 'address', addressValue);
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
