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

const patchUca = async (processId, userId, uca, value) => rp({
  url: `${validationModuleUrl}/processes/${processId}/ucas/${uca}`,
  method: 'PATCH',
  body: { value },
  headers: { user_id: userId },
  json: true,
  resolveWithFullResponse: true,
});

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
      expect(response.statusCode).to.equal(202);
      const { state } = response.body;
      expect(state.ucas.name.status).to.equal('ACCEPTED');
      expect(state.ucas.name.value).to.deep.equal(nameValue);
    });
  });
});
