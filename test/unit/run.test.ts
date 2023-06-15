import test from 'ava'

import { mockSessionFromQuerySet, QuerySpec, wrapCopiedResults } from 'neo-forgery'
import { run } from '../../src/run'
import { Format, TransactionType } from '../../src/types/settings'


const queryString =
    `match (movie:Movie)-[:ACTED_IN]-(actor:Person {name: $actor}) return movie.title as title`

const params = {
    actor: 'Tom Hanks'
}

const records =

    [
        {
            "keys": [
                "title"
            ],
            "length": 1,
            "_fields": [
                "Forrest Gump"
            ],
            "_fieldLookup": {
                "title": 0
            }
        },
        {
            "keys": [
                "title"
            ],
            "length": 1,
            "_fields": [
                "Big"
            ],
            "_fieldLookup": {
                "title": 0
            }
        }
    ]

const expectedResults = wrapCopiedResults(records,
    { foo: "bar" })

const simpleQuerySpec: QuerySpec = {
    name: 'sample',
    query: queryString,
    params,
    output: expectedResults
}



const updateQueryString = `
match (i:Instance {id:'cb71439d-8727-400a-aaf5-95cc2cad06f0'}) 
set i.value = $valueIn 
return i.value as value
`

const valueIn = 'newValue'

const updateResults = wrapCopiedResults(
    [
        {
            "keys": [
                "value"
            ],
            "length": 1,
            "_fields": [
                "foo1"
            ],
            "_fieldLookup": {
                "value": 0
            }
        }
    ]
)

const updateParams = { valueIn }

const updateQuerySpec: QuerySpec = {
    name: 'updateQuery',
    query: updateQueryString,
    params: updateParams,
    output: updateResults
}



const querySet: QuerySpec[] = [
    simpleQuerySpec,
    updateQuerySpec
]

const expected = [{ title: "Forrest Gump" }, { title: "Big" }]
const expectedWithSummary = {
    records: [{ title: "Forrest Gump" }, { title: "Big" }],
    summary: {
        foo: "bar"
    }
}
const expectedUpdate = [{ value: "foo1" }]


test('run with returned nodes', async (t: any) => {
    const session = mockSessionFromQuerySet(querySet)
    const result = await run(
        session,
        queryString,
        params,
    )

    t.like(result[0], expected[0]);
    t.like(result[1], expected[1]);
})


test('run() with transaction set to write works', async (t: any) => {
    const session = mockSessionFromQuerySet(querySet)
    const result = await run(
        session,
        queryString,
        params,
        Format.Complete,
        TransactionType.Write
    )

    t.like(result.records[0], expected[0]);
    t.like(result.records[1], expected[1]);
    t.is(result.summary.transactionType, 'WRITE')
})

test('run() with transaction set to read works', async (t: any) => {
    const session = mockSessionFromQuerySet(querySet)
    const result = await run(
        session,
        queryString,
        params,
        Format.Complete,
        TransactionType.Read
    )

    t.like(result.records[0], expected[0]);
    t.like(result.records[1], expected[1]);
    t.is(result.summary.transactionType, 'READ')
})



test('run with summary param', async (t: any) => {
    const session = mockSessionFromQuerySet(querySet)
    const result = await run(
        session,
        queryString,
        params,
        Format.Complete,
    )

    t.like(result, expectedWithSummary);
})

test('run with write transaction', async (t: any) => {
    const session = mockSessionFromQuerySet(querySet)
    const result = await run(
        session,
        updateQueryString,
        updateParams,
    )

    t.like(result[0], expectedUpdate[0]);
})

test('run() throws error string', async (t: any) => {
    const session = mockSessionFromQuerySet([])

    const error = await t.throwsAsync(async () => {
        await run(
            session,
            updateQueryString,
            updateParams,
        )


    })

    const errorMessage = "problem calling the query: \n  \n  query:\n  -----------------\n  match (i:Instance {id:'cb71439d-8727-400a-aaf5-95cc2cad06f0'}) \nset i.value = $valueIn \nreturn i.value as value\n  -----------------   \n  params: {\"valueIn\":\"newValue\"}\n  \n  \n        -------------------\n        Here is the error reported: Error: the query set provided does not contain the given query:\n\nquery:\n-----------------\nmatch (i:Instance {id:'cb71439d-8727-400a-aaf5-95cc2cad06f0'}) \nset i.value = $valueIn \nreturn i.value as value\n-----------------   \nparams: {\"valueIn\":\"newValue\"}\n"

    t.is(error.message, errorMessage);
})

