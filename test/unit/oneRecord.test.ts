import test from 'ava'
import { Format } from '../../src/types/settings'

import { mockSessionFromQuerySet, QuerySpec, wrapCopiedResults } from 'neo-forgery'
import { oneRecord } from '../../src/oneRecord'

const queryString = `
MATCH (user:User {name:$userNameOrEmail})-[:MEMBER_OF]->(platform:Platform {id:$fileId})
RETURN user.id AS userId, user.name AS userName, platform.id AS fileId
`

const userId = "fakeId"
const userName = "fakeName"
const fileId = 'fakeFileId'

const params = {
  "userNameOrEmail": userName,
  fileId
}


const expected = {
  userId,
  userName,
  fileId
}

const resultRecord = {
  "keys": [
    "userId",
    "userName",
    "fileId"
  ],
  "length": 3,
  "_fields": [
    userId,
    userName,
    fileId
  ],
  "_fieldLookup": {
    "userId": 0,
    "userName": 1,
    "fileId": 2
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

test('oneRecord complete format', async t => {
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

  t.regex(error.message, /problem calling the query/);
})


test('oneRecord throws error from faulty query results', async t => {

  const session = mockSessionFromQuerySet(querySet)
  session.readTransaction = () => { return { summary: 'defective records' } }

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

  t.is(result, null);
})


