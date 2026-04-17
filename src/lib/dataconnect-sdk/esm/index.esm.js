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

