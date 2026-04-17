const { queryRef, executeQuery, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'ipl-fantasy-connector',
  service: 'ipl-fantasy-league-71959-service',
  location: 'asia-south1'
};
exports.connectorConfig = connectorConfig;

exports.dcListHealthRef = function dcListHealthRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'DcListHealth', inputVars);
}
exports.dcListHealth = function dcListHealth(dcOrVars, vars) {
  return executeQuery(dcListHealthRef(dcOrVars, vars));
};
