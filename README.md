# neo-forte

A simple querying interface for a neo4j database, requiring only knowledge of cypher.

![](../images/neo-forte.gif)

[![codecov](https://codecov.io/gh/YizYah/neo-forte/branch/main/graph/badge.svg?token=019QO4XK1Z)](https://codecov.io/gh/YizYah/neo-forgery)
## Why

Using neo4j in js should be as simple as it is in the data browser.

## What

A few functions that allow anyone who can use cypher in the neo4j browser to run them in js code, without a learning curve.

It may not be sufficient for everything you'll ever need to do (see [Limitations](#limitations)).  But it lets you start without having to learn about the [neo4j driver](https://github.com/neo4j/neo4j-javascript-driver#readme).

## Usage

[1] Import the package:

```bash
npm i neo-forte
```

[2] Create a file `.env` at the project root level with these three variables (or add them to an existing one):

* DB_URI
* DB_USER
* DB_PASSWORD


You use those in the data browser:
  ![](../images/loginToDataBrowser.png)

See the `.env.sample` file for an example.

[3] Use the following functions, all defined in API below:

* _**getSession**_ returns a database session.
* _**run**_ runs a query with given params in a session.  Returns an array of objects containing your data.
* _**oneRecord**_ a special variation of `run()` that expects a single result and returns an object rather than an array.

You can then use the results directly in your code.  For example:

```typescript
import { getSession, run }  from 'neo-forte'

const queryString =
    `match (movie:Movie)-[:ACTED_IN]-(actor:Person {name: $actor}) return movie.title as title`

const params = {
    actor: 'Tom Hanks'
}

const session = await getSession()

const result = await run(
    session,
    queryString,
    params,
)
// in one sample database, the result is:
// result = [{ title: "Forrest Gump" }, { title: "Big" }]
```

## API

This package fundamentally does two things:

1. Creates a session
2. Runs queries


### Session Creation

You have to be able to generate a session with your database.  As suggested above, the simplest approach is to store these variables in your `.env` file:

* DB_URI,
* DB_USER,
* DB_PASSWORD

But you can also generate them for as many databases as you'd like.

#### DatabaseInfo type

The following enumeration is exposed for your use:

```
interface DatabaseInfo {
  URI: string;
  USER: string;
  PASSWORD: string;
  DATABASE?: string;
}
```

This is passed as parameter to `getSession()`. See the sample usage below.

#### getSession()

An async function returning a session:

```
async function getSession(databaseInfo?: DatabaseInfo)
```

Takes an optional [DatabaseInfo](#databaseinfo-type) as its only parameter. If no value is passed for `databaseInfo`:

1. If there are process.env variables, they are used.
2. If not, you get an error.

Here's a sample usage relying upon the `.env` file to provide the needed database info:

```typescript
import { getSession } from 'neo-forte'

(async ()=> {
  const session = await getSession()
  console.log(`session=${JSON.stringify(session, null, 2)}`)
})()
```

Here's a usage where `databaseInfo` is set manually:

```typescript
import {DatabaseInfo, getSession} from 'neo-forte'

const databaseInfo:DatabaseInfo = {
  URI: 'neo4j+s://73ab4d76.databases.neo4j.io,
  USER: 'neo4j',
  PASSWORD: '7BxrLxO8A3ffeldrbcedl2KJJK2Hyt08vPJ3lPQe60F',
}

(async ()=> {
  const session = await getSession(databaseInfo)
  console.log(`session=${JSON.stringify(session, null, 2)}`)
})()

```

> **_NOTE_**: `getSession()` will also check the validity of your connection.  If the test fails, you will receive an error.

### Running Queries

#### run

The main function is:
```
async function run(
    session: Session,
    queryString: string,
    params: any
)
```

It returns an array of objects. Simply have your query return the exact properties or values that you need, and they will appear as fields.

> **_NOTE_** For best results, make your query return specific needed fields rather than nodes. You can also return nodes, but to get to it's fields you'll need to access its `properties`.

If your query fails to execute, you will receive a clear error message, indicating the query and parameters that failed, and what the error was.

#### oneRecord

A second function, just for convenience, is:
```
export async function oneRecord(
    session: Session,
    queryString: string,
    params: any)
```

One record returns an object with the requested fields.  If more than one record is returned, `oneRecord` will return an error message.

If no records are returned, `oneRecord` returns null.


## Limitations

There are many use cases where you'll be best served to learn about the [neo4j driver](https://github.com/neo4j/neo4j-javascript-driver#readme). `neo-forte` just runs a simple query, but if you want to work with transactions, subscriptions, fancy async processing, or very large numbers, you should use the driver.  It's complex for a reason--it's very versatile.

## Relevant Package

This package actually uses [neo-forgery](https://www.npmjs.com/package/neo-forgery), and the two complement each other well. The goal of `neo-forgery` is to allow you to run unit tests by mocking the `neo4j-driver` easily.

Both are part of a mission to make programming with neo4j extremely simple. If you share that vision, please reach out with issues, or feel free to jump in and contribute!
