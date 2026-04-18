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
exports.listGameRoomsRef = function listGameRoomsRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListGameRooms', inputVars);
}
exports.listGameRooms = function listGameRooms(dcOrVars, vars) {
  return executeQuery(listGameRoomsRef(dcOrVars, vars));
};
exports.listGamePlayersRef = function listGamePlayersRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListGamePlayers', inputVars);
}
exports.listGamePlayers = function listGamePlayers(dcOrVars, vars) {
  return executeQuery(listGamePlayersRef(dcOrVars, vars));
};
exports.listLeaguesRef = function listLeaguesRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListLeagues', inputVars);
}
exports.listLeagues = function listLeagues(dcOrVars, vars) {
  return executeQuery(listLeaguesRef(dcOrVars, vars));
};
exports.listMatchesRef = function listMatchesRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMatches', inputVars);
}
exports.listMatches = function listMatches(dcOrVars, vars) {
  return executeQuery(listMatchesRef(dcOrVars, vars));
};
