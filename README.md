<!-- markdownlint-disable MD033 -->
# neo-forte

A simple querying interface for a neo4j database, requiring only knowledge of cypher.

![neo-forte](./images/neo-forte.gif)

[![codecov](https://codecov.io/gh/YizYah/neo-forte/branch/main/graph/badge.svg?token=NNHiLaLnlK)](https://codecov.io/gh/YizYah/neo-forte)

## Why

Running cypher in code should be *just as simple* as in the data browser!

## What

A few functions that allow anyone who knows cypher to run a query. `neo-forte` uses the [neo4j driver](https://github.com/neo4j/neo4j-javascript-driver#readme) to run your queries and returns simple jsons.

Queries automatically run using the [preferred practice](https://community.neo4j.com/t/difference-between-session-run-and-session-readtransaction-or-session-writetransaction/14720) of [transaction functions](https://neo4j.com/docs/javascript-manual/4.3/session-api/asynchronous/#js-driver-async-transaction-fn).

You can open a session with a simple call to `getSession()`.

There are two functions for running queries that return jsons:

* `run()` returns an array of objects
* `oneRecord()` returns a single object.

The types `Session` and `Driver` from the current version of the `neo4j-driver-core` are also exposted so that you can hard-type them in your code.

## Advantages

1. You usually don't need to declare a driver or specify credentials for a session. For instance:

   ```typescript
    const neo4j = require('neo4j-driver')

    const uri = process.env.URI;
    const user = process.env.USER_NAME
    const password = process.env.PASSWORD

    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
    const session = driver.session()

   ```

   becomes

   ```typescript
    const { getSession } = require('neo-forte')
    const session = getSession()
   ```

2. Running queries is as simple as in the browser.  In place of:

    ```typescript
    const result = await session.writeTransaction(tx =>
        tx.run(queryString, params)
    ```

    simply call

    ```typescript
    const result = await run(session, queryString, params)
    ```

3. Records returned are simple jsons:

    ```typescript
      result.records[0].get('name')
    ```

      becomes:
      * `result[0].name` with `run()`
      * `result.name` with `oneRecord()`.

At times, you may need to supplement `neo-forte` with neo4j-driver session methods (see [Limitations](#limitations)).  But to start you do not need to learn about the neo4j driver.

## Usage

[1] Install the package:

  ```bash
  npm i neo-forte
  ```

[2] Create a file `.env` at the project root level with these three variables (or add them to your existing `.env` file):

* DB_URI
* DB_USER
* DB_PASSWORD

Those are the credentials that you use to log into the data browser:
  ![sample browser login session](images/neo4jBrowserLogin.jpg)

Optionally, you can also use `DB_PASSWORD` if you want to have a session with a particular database.

You can just copy over the [.env.sample file](https://github.com/YizYah/neo-forte/blob/main/.env.sample) to `.env` and update the values there.

[3] Use the following functions, all defined in the [API](#api) section below:

* **getSession**: returns a database session.
* **getSessionVerify**: an async version that returns a database session after verifying the driver connection.
* **run**: runs a query with params in a session.  Returns an array of objects containing your data.
* **oneRecord**: a special variation of `run()` that expects a single result and returns an object rather than an array.

  You can then access the results directly in your code.  For example:

  ```typescript
  import { getSession, run }  from 'neo-forte'

  const queryString =
      `match (movie:Movie)-[:ACTED_IN]-(actor:Person {name: $actor}) return movie.title as title`

  const params = {
      actor: 'Tom Hanks'
  }

  const session = getSession()

  const result = await run(
      session,
      queryString,
      params,
  )
  // in one sample database, the result is:
  // result = [{ title: "Forrest Gump" }, { title: "Big" }]
  ```

## Transaction Types

Neo4j recommends [running transactions for production queries](https://community.neo4j.com/t/difference-between-session-run-and-session-readtransaction-or-session-writetransaction/14720).  That adds a bit of complexity that `neo-forte` hides from you.

There are two types of transactions: read and write.

By default, `neo-forte` automatically chooses which one to run from your query.  If a query string contains none of the updating clauses in cypher, then `session.readTransaction` is called.  Otherwise, `session.writeTransaction` is called.  

The list of updating clauses sought are:

* CREATE
* DELETE
* DETACH
* MERGE
* REMOVE
* SET

Usually, that works quite smoothly.  But, if you happen to use any of these reserved strings in a query, then the query will be interpreted as an updating query, and `writeTransaction` will be used.

That can result in queries being misclassified in the rare case that a variable or name includes as a substring any element in the list above.  For instance, the following query would be wrongly classified as an updating query:

```cypher
match (ns:NumberSet {id:$nsId}) return ns 
```

The reason is that the node type "NumberSet" contains "Set" as a substring. In the event that a query is wrongly classified as updating, `writeTransaction` will be used instead of `readTransaction`.  However, that should not affect query results.  In the worst case, the query may run less efficiently if you are using a [cluster](https://medium.com/neo4j/querying-neo4j-clusters-7d6fde75b5b4).

That said, if you happen to have a query that you would expect to be wrongly classified as updating, you can change the `transactionType` parameter in `run` from the default `TransactionType.Auto` to `TransactionType.Read`.  That option forces the query to be run within a `readTransaction`.

## Passing Custom Transaction Functions

If you want to create your own custom function to pass into a transaction, then you need to call the `session.readTransaction()` or `session.writeTransaction()` methods built into `neo4j-driver`.  Here's an example:

```typescript
import { getSession }  from 'neo-forte'
const session = await getSession()

try {
  const relationshipsCreated = await session.writeTransaction(tx =>
    Promise.all(
      names.map(name =>
        tx
          .run(
            'MATCH (emp:Person {name: $person_name}) ' +
              'MERGE (com:Company {name: $company_name}) ' +
              'MERGE (emp)-[:WORKS_FOR]->(com)',
            { person_name: name, company_name: companyName }
          )
          .then(
            result =>
              result.summary.counters.updates().relationshipsCreated
          )
          .then(relationshipsCreated =>
            neo4j.int(relationshipsCreated).toInt()
          )
      )
    ).then(values => values.reduce((a, b) => a + b))
  )
} finally {
  await session.close()
}

```

See the [driver documentation](https://neo4j.com/docs/javascript-manual/4.3/session-api/asynchronous/) for more information.

## API

This package fundamentally does 2 things:

1. Creates a session
2. Runs queries

### Creating a Session

As suggested above, the simplest approach is to store these variables in your `.env` file:

* DB_URI,
* DB_USER,
* DB_PASSWORD
* [DB_DATABASE]

But you can also generate sessions for as other databases as needed.

#### DatabaseInfo type

The following types are exposed for your use:

```typescript
interface DatabaseInfo {
  URI: string;
  USER: string;
  PASSWORD: string;
  DATABASE?: string;
}

Session //bfrom the driver core
Driver // from the driver core
```

So, for instance, you can hard-type an instance of a session as follows:

```typescript
import { getSession }  from 'neo-forte'
const session: Session = await getSession()

```

#### getSession()

Returns a session synchronously:

```typescript
function getSession(databaseInfo?: DatabaseInfo, config?: Config): Session
```

Takes an optional [DatabaseInfo](#databaseinfo-type) as its first parameter. If no value is passed for `databaseInfo`, here is what getSession does:

1. If there are `process.env` variables, then they are used by default and a session is returned;
2. If not, an error is thrown.

You can also optionally add a `Config` object for the driver. See the [neo4j driver documentation]{https://neo4j.com/docs/api/javascript-driver/current/class/lib6/types.js~Config.html} for more information.  For instance:

```typescript
const config: Config = {
    maxConnectionPoolSize: 10, // Adjust based on your usage
    connectionAcquisitionTimeout: 120000, // 2 minutes
}
```

Here's a sample usage relying upon the `.env` file to provide the needed database info:

```typescript
import { getSession, Session } from 'neo-forte'

(()=> {
  const session: Session = getSession()
  console.log(`session=${JSON.stringify(session, null, 2)}`)
})()
```

Here's a more complex usage. A config is used, and  `databaseInfo` is set manually:

```typescript
import { getSession, DatabaseInfo, Session, Config } from 'neo-forte'

const config: Config = {
    maxConnectionPoolSize: 10, // Adjust based on your usage
    connectionAcquisitionTimeout: 120000, // 2 minutes
}

const databaseInfo:DatabaseInfo = {
  URI: 'neo4j+s://73ab4d76.databases.neo4j.io,
  USER: 'neo4j',
  PASSWORD: '7BxrLxO8Arbce3ffelddl2KJJK2Hyt08vPJ3lPQe60F',
}

(()=> {
  const session: Session = getSession(databaseInfo, config)
  console.log(`session=${JSON.stringify(session, null, 2)}`)
})()

```

#### getSessionVerify()

An async version of `getSession` that also verifies your connection.  Everything else is the same as `getSession`.

```typescript
async function getSessionVerify(databaseInfo?: DatabaseInfo)
```

Here's a sample usage:

```typescript
import { getSessionVerify } from 'neo-forte'

(async ()=> {
  const session = await getSessionVerify()
  console.log(`session=${JSON.stringify(session, null, 2)}`)
})()
```

> ***NOTE***: `getSessionVerify()` will check the validity of your connection.  If the test fails, you will receive an error.

### Running Queries

There are two functions to run a query: `run` and `oneRecord`.

#### run

This function uses two exposed enums as parameter types:

```typescript
enum Format {
    DataOnly,
    Complete,
}

enum TransactionType {
    Auto,
    Read,
    Write,
}

```

The function declaration looks like this:

```typescript
async function run(
    session: Session,
    queryString: string,
    params: any,
    format: Format = Format.DataOnly,
    transactionType: TransactionType = TransactionType.Auto
)
```

`run` returns an array of objects. Simply have your query return specific needed fields or values, and they will appear as keys within the objects of the array.

> ***NOTE*** For best results, do not return simple nodes.  It is not a problem, they will be stored as jsons. But to get to their fields, you'll then need to access their `properties`.

If your query fails to execute, you will receive a clear error message, indicating the specific query and parameters that failed, and what the error was.  For instance:

```terminal
Error: the query set provided does not contain the given query:

query:
-----------------
MATCH (user:User {name:$name})-[:USES]->(resource:Resource {id:$resourceId})
RETURN user.id AS userId, user.name AS userName, resource.id AS resourceId
-----------------   
params: {"name":"Bruce","resourceId":"printer-XYX11aC42s"}
```

If you want to see the `summary` statistics, for instance to confirm that a node was deleted, you can set the optional parameter `format` to `Format.Complete` rather than the default `Format.DataOnly`.  Doing so will return an object with two keys:

* `records`: the records returned from the query
* `summary`: a json of all of the summary statistics returned from the query.

You will probably not need to do so often.

The other optional parameter is `transactionType`.  As is discussed in [Transaction Types](#transaction-types), by default the correct type is determined automatically.  However, if you'd like to specify that the transaction type should be `read` or `write`, you may do so this way.

#### oneRecord

A second function, just for convenience, is:

```typescript
export async function oneRecord(
    session: Session,
    queryString: string,
    params: any)
```

`oneRecord` returns an object with the requested fields.  If more than one record is returned, `oneRecord` will return an error message.

If no records are returned, `oneRecord` returns null.

You cannot specify that you want to see a summary with `oneRecord`.  For that, you must call `run`.

## Limitations

There are use cases where you'll be best served to call the [neo4j driver](https://github.com/neo4j/neo4j-javascript-driver#readme) directly. The driver is complex for a reason--it's very versatile.

See in particular [Passing Custom Transaction Functions](#passing-custom-transaction-functions).  

Note that the session returned by `getSession()` is a fully functional neo4j driver session.  So you can call any session method that you like as described in the driver documentation.

## Relevant Package

This package actually uses [neo-forgery](https://github.com/YizYah/neo-forgery).  The two complement each other well. The goal of `neo-forgery` is to allow you to run unit tests by mocking the `neo4j-driver` easily.

Both pursue a shared mission: programming with neo4j<a href="#note1" id="note1ref"><sup>2</sup></a> should be really simple!

---
<a id="note1" href="#note1ref"><sup>2</sup></a> Or any third party service.

## Contributing

If you share that vision :thumbsup:, please reach out with issues, or feel free to jump in and contribute!

## Special Thanks

As with [neo-forgery](https://github.com/YizYah/neo-forgery), a big thanks to [Antonio Barcélos](https://github.com/bigmontz) on the [neo4j-driver](https://github.com/neo4j/neo4j-javascript-driver) team for his feedback on making this tool optimally useful.
