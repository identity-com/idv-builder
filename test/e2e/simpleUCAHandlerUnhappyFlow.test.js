const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const {
  createValidationProcess,
  getValidationProccess,
  patchUCA,
} = require('./utils');

chai.use(chaiAsPromised);
const { expect } = chai;

const checkForInvalidUCA = (patchUCAResponse, uca, ucaValue, expectedRetriesRemaining) => {
  expect(patchUCAResponse.statusCode).to.equal(202);
  const { state } = patchUCAResponse.body;
  const ucaData = state.ucas[uca];
  expect(ucaData.status).to.equal('INVALID');
  expect(ucaData.value).to.deep.equal(ucaValue);
  expect(ucaData.retriesRemaining).to.deep.equal(expectedRetriesRemaining);
};

describe('Simple UCA handler E2E test - Error Flow', () => {
  context('Fail validation by submitting invalid UCA values multiple times', () => {
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

    step('2. Submit an invalid date of birth UCA multiple times', async () => {
      // date of birth of 10 years ago
      const dateOfBirthValue = {
        year: new Date().getFullYear() - 10,
		    month: 1,
		    day: 1,
      };
      // patch the date of birth multiple times until the process is failed
      // the handler only accepts users over 21
      let response = await patchUCA(processId, userId, 'dateOfBirth', dateOfBirthValue);
      checkForInvalidUCA(response, 'dateOfBirth', dateOfBirthValue, 2);
      response = await patchUCA(processId, userId, 'dateOfBirth', dateOfBirthValue);
      checkForInvalidUCA(response, 'dateOfBirth', dateOfBirthValue, 1);
      response = await patchUCA(processId, userId, 'dateOfBirth', dateOfBirthValue);
      checkForInvalidUCA(response, 'dateOfBirth', dateOfBirthValue, 0);
    });

    step('3. Confirm validation process is failed', async () => {
      const response = await getValidationProccess(processId, userId);
      expect(response.body.state.status).to.equal('FAILED');
    });
  });
});
