const rp = require('request-promise-native');

const validationModuleUrl = 'http://localhost:6060';

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

const patchUCA = async (processId, userId, uca, value) => rp({
  url: `${validationModuleUrl}/processes/${processId}/ucas/${uca}`,
  method: 'PATCH',
  body: { value },
  headers: { user_id: userId },
  json: true,
  resolveWithFullResponse: true,
});

module.exports = {
  listPlans,
  createValidationProcess,
  getValidationProccess,
  patchUCA,
};
