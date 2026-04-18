import { queryRef, executeQuery, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'ipl-fantasy-connector',
  service: 'ipl-fantasy-league-71959-service',
  location: 'asia-south1'
};

export function dcListHealthRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'DcListHealth', inputVars);
}

export function dcListHealth(dcOrVars, vars) {
  return executeQuery(dcListHealthRef(dcOrVars, vars));
}

export function listGameRoomsRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListGameRooms', inputVars);
}

export function listGameRooms(dcOrVars, vars) {
  return executeQuery(listGameRoomsRef(dcOrVars, vars));
}

export function listGamePlayersRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListGamePlayers', inputVars);
}

export function listGamePlayers(dcOrVars, vars) {
  return executeQuery(listGamePlayersRef(dcOrVars, vars));
}

export function listLeaguesRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListLeagues', inputVars);
}

export function listLeagues(dcOrVars, vars) {
  return executeQuery(listLeaguesRef(dcOrVars, vars));
}

export function listMatchesRef(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMatches', inputVars);
}

export function listMatches(dcOrVars, vars) {
  return executeQuery(listMatchesRef(dcOrVars, vars));
}

