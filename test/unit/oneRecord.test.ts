import test from 'ava'

import { mockSessionFromQuerySet, QuerySpec, wrapCopiedResults } from 'neo-forgery'
import { oneRecord } from '../../src/oneRecord'

const queryString = `
MATCH (user:User {name:$userNameOrEmail})-[:MEMBER_OF]->(platform:Platform {id:$platformId})
RETURN user.id AS userId, user.name AS userName, platform.id AS platformId
`
const params = {
  "userNameOrEmail": "Me",
  "platformId": "us-east-1_kYI8RNIb1"
}

const expected = {
  "userId": "1cf90994-d154-4544-88d0-5f1398673381",
  "userName": "Me",
  "platformId": "us-east-1_kYI8RNIb1"
}

const resultRecord = {
  "keys": [
    "userId",
    "userName",
    "platformId"
  ],
  "length": 3,
  "_fields": [
    "1cf90994-d154-4544-88d0-5f1398673381",
    "Me",
    "us-east-1_kYI8RNIb1"
  ],
  "_fieldLookup": {
    "userId": 0,
    "userName": 1,
    "platformId": 2
  }
}

const queryResults = {
  "records": [
    resultRecord
  ],
}


const querySet: QuerySpec[] = [
  {
    name: 'sample',
    query: queryString,
    params,
    output: queryResults
  }
]


test('oneRecord', async t => {
  const session = mockSessionFromQuerySet(querySet)
  const result = await oneRecord(
    session,
    queryString,
    params,
  )
  t.like(result, expected);
})

test('oneRecord throws error from faulty session', async t => {
  const session = mockSessionFromQuerySet([])

  const error = await t.throwsAsync(async () => {
    await oneRecord(session,
      queryString,
      params,
    )

  })

  console.log(error.message)

  t.regex(error.message, /problem calling the query/);
})


test('oneRecord throws error from faulty query results', async t => {

  const session = mockSessionFromQuerySet(querySet)
  session.run = () => { return { summary: 'defective records' } }

  const error = await t.throwsAsync(async () => {
    await oneRecord(
      session,
      queryString,
      params,
    )

  })


  t.regex(error.message, /problem converting to/);
})


test('oneRecord throws error from multiple record results', async t => {
  const queryResultsMultiple = {
    "records": [
      resultRecord,
      resultRecord
    ],
  }

  const querySetMultiple: QuerySpec[] = [
    {
      name: 'sample',
      query: queryString,
      params,
      output: queryResultsMultiple
    }
  ]

  const session = mockSessionFromQuerySet(querySetMultiple)

  const error = await t.throwsAsync(async () => {
    const result = await oneRecord(
      session,
      queryString,
      params,
    )

  })
  

  t.regex(error.message, /More than one result/);
})


test('oneRecord returns null when no records', async t => {
  const queryResultsNoRecords = {
    "records": [
    ],
  }

  const querySetMultiple: QuerySpec[] = [
    {
      name: 'sample',
      query: queryString,
      params,
      output: queryResultsNoRecords
    }
  ]

  const session = mockSessionFromQuerySet(querySetMultiple)

  const result = await oneRecord(
    session,
    queryString,
    params,
  )
  console.log(`result=${JSON.stringify(result, null, 2)}`);

  t.is(result, null);
})


