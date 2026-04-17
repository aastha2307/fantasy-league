import { ConnectorConfig, DataConnect, QueryRef, QueryPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface DcHealth_Key {
  id: UUIDString;
  __typename?: 'DcHealth_Key';
}

export interface DcListHealthData {
  dcHealths: ({
    id: UUIDString;
    label: string;
  } & DcHealth_Key)[];
}

export interface DcListHealthVariables {
  limit?: number | null;
}

/* Allow users to create refs without passing in DataConnect */
export function dcListHealthRef(vars?: DcListHealthVariables): QueryRef<DcListHealthData, DcListHealthVariables>;
/* Allow users to pass in custom DataConnect instances */
export function dcListHealthRef(dc: DataConnect, vars?: DcListHealthVariables): QueryRef<DcListHealthData, DcListHealthVariables>;

export function dcListHealth(vars?: DcListHealthVariables): QueryPromise<DcListHealthData, DcListHealthVariables>;
export function dcListHealth(dc: DataConnect, vars?: DcListHealthVariables): QueryPromise<DcListHealthData, DcListHealthVariables>;

