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

export interface GamePlayer_Key {
  id: string;
  __typename?: 'GamePlayer_Key';
}

export interface GameRoom_Key {
  id: string;
  __typename?: 'GameRoom_Key';
}

export interface League_Key {
  id: string;
  __typename?: 'League_Key';
}

export interface ListGamePlayersData {
  gamePlayers: ({
    id: string;
    displayName: string;
    ocrPoints?: number | null;
    createdAt: TimestampString;
  } & GamePlayer_Key)[];
}

export interface ListGamePlayersVariables {
  roomId: string;
  limit?: number | null;
}

export interface ListGameRoomsData {
  gameRooms: ({
    id: string;
    cricApiMatchId: string;
    label: string;
    createdAt: TimestampString;
  } & GameRoom_Key)[];
}

export interface ListGameRoomsVariables {
  limit?: number | null;
}

export interface ListLeaguesData {
  leagues: ({
    id: string;
    name: string;
    joinCode: string;
    createdAt: TimestampString;
  } & League_Key)[];
}

export interface ListLeaguesVariables {
  limit?: number | null;
}

export interface ListMatchesData {
  matches: ({
    id: string;
    label: string;
    matchDate?: TimestampString | null;
    cricApiMatchId?: string | null;
    createdAt: TimestampString;
  } & Match_Key)[];
}

export interface ListMatchesVariables {
  leagueId: string;
  limit?: number | null;
}

export interface Match_Key {
  id: string;
  __typename?: 'Match_Key';
}

export interface Member_Key {
  id: string;
  __typename?: 'Member_Key';
}

export interface PlayerMatchPoints_Key {
  id: string;
  __typename?: 'PlayerMatchPoints_Key';
}

export interface TeamSubmission_Key {
  id: string;
  __typename?: 'TeamSubmission_Key';
}

/* Allow users to create refs without passing in DataConnect */
export function dcListHealthRef(vars?: DcListHealthVariables): QueryRef<DcListHealthData, DcListHealthVariables>;
/* Allow users to pass in custom DataConnect instances */
export function dcListHealthRef(dc: DataConnect, vars?: DcListHealthVariables): QueryRef<DcListHealthData, DcListHealthVariables>;

export function dcListHealth(vars?: DcListHealthVariables): QueryPromise<DcListHealthData, DcListHealthVariables>;
export function dcListHealth(dc: DataConnect, vars?: DcListHealthVariables): QueryPromise<DcListHealthData, DcListHealthVariables>;

/* Allow users to create refs without passing in DataConnect */
export function listGameRoomsRef(vars?: ListGameRoomsVariables): QueryRef<ListGameRoomsData, ListGameRoomsVariables>;
/* Allow users to pass in custom DataConnect instances */
export function listGameRoomsRef(dc: DataConnect, vars?: ListGameRoomsVariables): QueryRef<ListGameRoomsData, ListGameRoomsVariables>;

export function listGameRooms(vars?: ListGameRoomsVariables): QueryPromise<ListGameRoomsData, ListGameRoomsVariables>;
export function listGameRooms(dc: DataConnect, vars?: ListGameRoomsVariables): QueryPromise<ListGameRoomsData, ListGameRoomsVariables>;

/* Allow users to create refs without passing in DataConnect */
export function listGamePlayersRef(vars: ListGamePlayersVariables): QueryRef<ListGamePlayersData, ListGamePlayersVariables>;
/* Allow users to pass in custom DataConnect instances */
export function listGamePlayersRef(dc: DataConnect, vars: ListGamePlayersVariables): QueryRef<ListGamePlayersData, ListGamePlayersVariables>;

export function listGamePlayers(vars: ListGamePlayersVariables): QueryPromise<ListGamePlayersData, ListGamePlayersVariables>;
export function listGamePlayers(dc: DataConnect, vars: ListGamePlayersVariables): QueryPromise<ListGamePlayersData, ListGamePlayersVariables>;

/* Allow users to create refs without passing in DataConnect */
export function listLeaguesRef(vars?: ListLeaguesVariables): QueryRef<ListLeaguesData, ListLeaguesVariables>;
/* Allow users to pass in custom DataConnect instances */
export function listLeaguesRef(dc: DataConnect, vars?: ListLeaguesVariables): QueryRef<ListLeaguesData, ListLeaguesVariables>;

export function listLeagues(vars?: ListLeaguesVariables): QueryPromise<ListLeaguesData, ListLeaguesVariables>;
export function listLeagues(dc: DataConnect, vars?: ListLeaguesVariables): QueryPromise<ListLeaguesData, ListLeaguesVariables>;

/* Allow users to create refs without passing in DataConnect */
export function listMatchesRef(vars: ListMatchesVariables): QueryRef<ListMatchesData, ListMatchesVariables>;
/* Allow users to pass in custom DataConnect instances */
export function listMatchesRef(dc: DataConnect, vars: ListMatchesVariables): QueryRef<ListMatchesData, ListMatchesVariables>;

export function listMatches(vars: ListMatchesVariables): QueryPromise<ListMatchesData, ListMatchesVariables>;
export function listMatches(dc: DataConnect, vars: ListMatchesVariables): QueryPromise<ListMatchesData, ListMatchesVariables>;

