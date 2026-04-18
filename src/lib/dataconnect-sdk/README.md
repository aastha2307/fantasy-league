# Table of Contents
- [**Overview**](#generated-typescript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*DcListHealth*](#dclisthealth)
  - [*ListGameRooms*](#listgamerooms)
  - [*ListGamePlayers*](#listgameplayers)
  - [*ListLeagues*](#listleagues)
  - [*ListMatches*](#listmatches)
- [**Mutations**](#mutations)

# Generated TypeScript README
This README will guide you through the process of using the generated TypeScript SDK package for the connector `ipl-fantasy-connector`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@ipl-fantasy/dataconnect` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `ipl-fantasy-connector`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect, DataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@ipl-fantasy/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```javascript
import { connectDataConnectEmulator, getDataConnect, DataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@ipl-fantasy/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `ipl-fantasy-connector` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## DcListHealth
You can execute the `DcListHealth` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```javascript
dcListHealth(vars?: DcListHealthVariables): QueryPromise<DcListHealthData, DcListHealthVariables>;

dcListHealthRef(vars?: DcListHealthVariables): QueryRef<DcListHealthData, DcListHealthVariables>;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```javascript
dcListHealth(dc: DataConnect, vars?: DcListHealthVariables): QueryPromise<DcListHealthData, DcListHealthVariables>;

dcListHealthRef(dc: DataConnect, vars?: DcListHealthVariables): QueryRef<DcListHealthData, DcListHealthVariables>;
```

### Variables
The `DcListHealth` query has an optional argument of type `DcListHealthVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```javascript
export interface DcListHealthVariables {
  limit?: number | null;
}
```
### Return Type
Recall that executing the `DcListHealth` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DcListHealthData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```javascript
export interface DcListHealthData {
  dcHealths: ({
    id: UUIDString;
    label: string;
  } & DcHealth_Key)[];
}
```
### Using `DcListHealth`'s action shortcut function

```javascript
import { getDataConnect, DataConnect } from 'firebase/data-connect';
import { connectorConfig, dcListHealth, DcListHealthVariables } from '@ipl-fantasy/dataconnect';

// The `DcListHealth` query has an optional argument of type `DcListHealthVariables`:
const dcListHealthVars: DcListHealthVariables = {
  limit: ..., // optional
};

// Call the `dcListHealth()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await dcListHealth(dcListHealthVars);
// Variables can be defined inline as well.
const { data } = await dcListHealth({ limit: ..., });
// Since all variables are optional for this query, you can omit the `DcListHealthVariables` argument.
const { data } = await dcListHealth();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await dcListHealth(dataConnect, dcListHealthVars);

console.log(data.dcHealths);

// Or, you can use the `Promise` API.
dcListHealth(dcListHealthVars).then((response) => {
  const data = response.data;
  console.log(data.dcHealths);
});
```

### Using `DcListHealth`'s `QueryRef` function

```javascript
import { getDataConnect, DataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, dcListHealthRef, DcListHealthVariables } from '@ipl-fantasy/dataconnect';

// The `DcListHealth` query has an optional argument of type `DcListHealthVariables`:
const dcListHealthVars: DcListHealthVariables = {
  limit: ..., // optional
};

// Call the `dcListHealthRef()` function to get a reference to the query.
const ref = dcListHealthRef(dcListHealthVars);
// Variables can be defined inline as well.
const ref = dcListHealthRef({ limit: ..., });
// Since all variables are optional for this query, you can omit the `DcListHealthVariables` argument.
const ref = dcListHealthRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = dcListHealthRef(dataConnect, dcListHealthVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.dcHealths);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.dcHealths);
});
```

## ListGameRooms
You can execute the `ListGameRooms` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```javascript
listGameRooms(vars?: ListGameRoomsVariables): QueryPromise<ListGameRoomsData, ListGameRoomsVariables>;

listGameRoomsRef(vars?: ListGameRoomsVariables): QueryRef<ListGameRoomsData, ListGameRoomsVariables>;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```javascript
listGameRooms(dc: DataConnect, vars?: ListGameRoomsVariables): QueryPromise<ListGameRoomsData, ListGameRoomsVariables>;

listGameRoomsRef(dc: DataConnect, vars?: ListGameRoomsVariables): QueryRef<ListGameRoomsData, ListGameRoomsVariables>;
```

### Variables
The `ListGameRooms` query has an optional argument of type `ListGameRoomsVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```javascript
export interface ListGameRoomsVariables {
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListGameRooms` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListGameRoomsData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```javascript
export interface ListGameRoomsData {
  gameRooms: ({
    id: string;
    cricApiMatchId: string;
    label: string;
    createdAt: TimestampString;
  } & GameRoom_Key)[];
}
```
### Using `ListGameRooms`'s action shortcut function

```javascript
import { getDataConnect, DataConnect } from 'firebase/data-connect';
import { connectorConfig, listGameRooms, ListGameRoomsVariables } from '@ipl-fantasy/dataconnect';

// The `ListGameRooms` query has an optional argument of type `ListGameRoomsVariables`:
const listGameRoomsVars: ListGameRoomsVariables = {
  limit: ..., // optional
};

// Call the `listGameRooms()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listGameRooms(listGameRoomsVars);
// Variables can be defined inline as well.
const { data } = await listGameRooms({ limit: ..., });
// Since all variables are optional for this query, you can omit the `ListGameRoomsVariables` argument.
const { data } = await listGameRooms();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listGameRooms(dataConnect, listGameRoomsVars);

console.log(data.gameRooms);

// Or, you can use the `Promise` API.
listGameRooms(listGameRoomsVars).then((response) => {
  const data = response.data;
  console.log(data.gameRooms);
});
```

### Using `ListGameRooms`'s `QueryRef` function

```javascript
import { getDataConnect, DataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listGameRoomsRef, ListGameRoomsVariables } from '@ipl-fantasy/dataconnect';

// The `ListGameRooms` query has an optional argument of type `ListGameRoomsVariables`:
const listGameRoomsVars: ListGameRoomsVariables = {
  limit: ..., // optional
};

// Call the `listGameRoomsRef()` function to get a reference to the query.
const ref = listGameRoomsRef(listGameRoomsVars);
// Variables can be defined inline as well.
const ref = listGameRoomsRef({ limit: ..., });
// Since all variables are optional for this query, you can omit the `ListGameRoomsVariables` argument.
const ref = listGameRoomsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listGameRoomsRef(dataConnect, listGameRoomsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.gameRooms);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.gameRooms);
});
```

## ListGamePlayers
You can execute the `ListGamePlayers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```javascript
listGamePlayers(vars: ListGamePlayersVariables): QueryPromise<ListGamePlayersData, ListGamePlayersVariables>;

listGamePlayersRef(vars: ListGamePlayersVariables): QueryRef<ListGamePlayersData, ListGamePlayersVariables>;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```javascript
listGamePlayers(dc: DataConnect, vars: ListGamePlayersVariables): QueryPromise<ListGamePlayersData, ListGamePlayersVariables>;

listGamePlayersRef(dc: DataConnect, vars: ListGamePlayersVariables): QueryRef<ListGamePlayersData, ListGamePlayersVariables>;
```

### Variables
The `ListGamePlayers` query requires an argument of type `ListGamePlayersVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```javascript
export interface ListGamePlayersVariables {
  roomId: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListGamePlayers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListGamePlayersData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```javascript
export interface ListGamePlayersData {
  gamePlayers: ({
    id: string;
    displayName: string;
    ocrPoints?: number | null;
    createdAt: TimestampString;
  } & GamePlayer_Key)[];
}
```
### Using `ListGamePlayers`'s action shortcut function

```javascript
import { getDataConnect, DataConnect } from 'firebase/data-connect';
import { connectorConfig, listGamePlayers, ListGamePlayersVariables } from '@ipl-fantasy/dataconnect';

// The `ListGamePlayers` query requires an argument of type `ListGamePlayersVariables`:
const listGamePlayersVars: ListGamePlayersVariables = {
  roomId: ..., 
  limit: ..., // optional
};

// Call the `listGamePlayers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listGamePlayers(listGamePlayersVars);
// Variables can be defined inline as well.
const { data } = await listGamePlayers({ roomId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listGamePlayers(dataConnect, listGamePlayersVars);

console.log(data.gamePlayers);

// Or, you can use the `Promise` API.
listGamePlayers(listGamePlayersVars).then((response) => {
  const data = response.data;
  console.log(data.gamePlayers);
});
```

### Using `ListGamePlayers`'s `QueryRef` function

```javascript
import { getDataConnect, DataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listGamePlayersRef, ListGamePlayersVariables } from '@ipl-fantasy/dataconnect';

// The `ListGamePlayers` query requires an argument of type `ListGamePlayersVariables`:
const listGamePlayersVars: ListGamePlayersVariables = {
  roomId: ..., 
  limit: ..., // optional
};

// Call the `listGamePlayersRef()` function to get a reference to the query.
const ref = listGamePlayersRef(listGamePlayersVars);
// Variables can be defined inline as well.
const ref = listGamePlayersRef({ roomId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listGamePlayersRef(dataConnect, listGamePlayersVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.gamePlayers);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.gamePlayers);
});
```

## ListLeagues
You can execute the `ListLeagues` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```javascript
listLeagues(vars?: ListLeaguesVariables): QueryPromise<ListLeaguesData, ListLeaguesVariables>;

listLeaguesRef(vars?: ListLeaguesVariables): QueryRef<ListLeaguesData, ListLeaguesVariables>;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```javascript
listLeagues(dc: DataConnect, vars?: ListLeaguesVariables): QueryPromise<ListLeaguesData, ListLeaguesVariables>;

listLeaguesRef(dc: DataConnect, vars?: ListLeaguesVariables): QueryRef<ListLeaguesData, ListLeaguesVariables>;
```

### Variables
The `ListLeagues` query has an optional argument of type `ListLeaguesVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```javascript
export interface ListLeaguesVariables {
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListLeagues` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListLeaguesData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```javascript
export interface ListLeaguesData {
  leagues: ({
    id: string;
    name: string;
    joinCode: string;
    createdAt: TimestampString;
  } & League_Key)[];
}
```
### Using `ListLeagues`'s action shortcut function

```javascript
import { getDataConnect, DataConnect } from 'firebase/data-connect';
import { connectorConfig, listLeagues, ListLeaguesVariables } from '@ipl-fantasy/dataconnect';

// The `ListLeagues` query has an optional argument of type `ListLeaguesVariables`:
const listLeaguesVars: ListLeaguesVariables = {
  limit: ..., // optional
};

// Call the `listLeagues()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listLeagues(listLeaguesVars);
// Variables can be defined inline as well.
const { data } = await listLeagues({ limit: ..., });
// Since all variables are optional for this query, you can omit the `ListLeaguesVariables` argument.
const { data } = await listLeagues();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listLeagues(dataConnect, listLeaguesVars);

console.log(data.leagues);

// Or, you can use the `Promise` API.
listLeagues(listLeaguesVars).then((response) => {
  const data = response.data;
  console.log(data.leagues);
});
```

### Using `ListLeagues`'s `QueryRef` function

```javascript
import { getDataConnect, DataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listLeaguesRef, ListLeaguesVariables } from '@ipl-fantasy/dataconnect';

// The `ListLeagues` query has an optional argument of type `ListLeaguesVariables`:
const listLeaguesVars: ListLeaguesVariables = {
  limit: ..., // optional
};

// Call the `listLeaguesRef()` function to get a reference to the query.
const ref = listLeaguesRef(listLeaguesVars);
// Variables can be defined inline as well.
const ref = listLeaguesRef({ limit: ..., });
// Since all variables are optional for this query, you can omit the `ListLeaguesVariables` argument.
const ref = listLeaguesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listLeaguesRef(dataConnect, listLeaguesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.leagues);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.leagues);
});
```

## ListMatches
You can execute the `ListMatches` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```javascript
listMatches(vars: ListMatchesVariables): QueryPromise<ListMatchesData, ListMatchesVariables>;

listMatchesRef(vars: ListMatchesVariables): QueryRef<ListMatchesData, ListMatchesVariables>;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```javascript
listMatches(dc: DataConnect, vars: ListMatchesVariables): QueryPromise<ListMatchesData, ListMatchesVariables>;

listMatchesRef(dc: DataConnect, vars: ListMatchesVariables): QueryRef<ListMatchesData, ListMatchesVariables>;
```

### Variables
The `ListMatches` query requires an argument of type `ListMatchesVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```javascript
export interface ListMatchesVariables {
  leagueId: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `ListMatches` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMatchesData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```javascript
export interface ListMatchesData {
  matches: ({
    id: string;
    label: string;
    matchDate?: TimestampString | null;
    cricApiMatchId?: string | null;
    createdAt: TimestampString;
  } & Match_Key)[];
}
```
### Using `ListMatches`'s action shortcut function

```javascript
import { getDataConnect, DataConnect } from 'firebase/data-connect';
import { connectorConfig, listMatches, ListMatchesVariables } from '@ipl-fantasy/dataconnect';

// The `ListMatches` query requires an argument of type `ListMatchesVariables`:
const listMatchesVars: ListMatchesVariables = {
  leagueId: ..., 
  limit: ..., // optional
};

// Call the `listMatches()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMatches(listMatchesVars);
// Variables can be defined inline as well.
const { data } = await listMatches({ leagueId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMatches(dataConnect, listMatchesVars);

console.log(data.matches);

// Or, you can use the `Promise` API.
listMatches(listMatchesVars).then((response) => {
  const data = response.data;
  console.log(data.matches);
});
```

### Using `ListMatches`'s `QueryRef` function

```javascript
import { getDataConnect, DataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMatchesRef, ListMatchesVariables } from '@ipl-fantasy/dataconnect';

// The `ListMatches` query requires an argument of type `ListMatchesVariables`:
const listMatchesVars: ListMatchesVariables = {
  leagueId: ..., 
  limit: ..., // optional
};

// Call the `listMatchesRef()` function to get a reference to the query.
const ref = listMatchesRef(listMatchesVars);
// Variables can be defined inline as well.
const ref = listMatchesRef({ leagueId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMatchesRef(dataConnect, listMatchesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.matches);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.matches);
});
```

# Mutations

No mutations were generated for the `ipl-fantasy-connector` connector.

If you want to learn more about how to use mutations in Data Connect, you can follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

