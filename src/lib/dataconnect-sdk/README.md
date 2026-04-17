# Table of Contents
- [**Overview**](#generated-typescript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*DcListHealth*](#dclisthealth)
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

# Mutations

No mutations were generated for the `ipl-fantasy-connector` connector.

If you want to learn more about how to use mutations in Data Connect, you can follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

