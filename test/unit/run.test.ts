import test from 'ava'

import { mockSessionFromQuerySet, QuerySpec, wrapCopiedResults } from 'neo-forgery'
import { run } from '../../src/run'


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

const expectedResults = wrapCopiedResults(records)

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

const updateResults = wrapCopiedResults([
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
])

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
const expectedUpdate = [{ value: "foo1" }]


test('run with returned nodes', async t => {
    const session = mockSessionFromQuerySet(querySet)
    const result = await run(
        session,
        queryString,
        params,
    )

    t.like(result[0], expected[0]);
    t.like(result[1], expected[1]);
})


test('run with write transaction', async t => {
    const session = mockSessionFromQuerySet(querySet)
    const result = await run(
        session,
        updateQueryString,
        updateParams,
    )

    t.like(result[0], expectedUpdate[0]);
})