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


const querySet: QuerySpec[] = [
    {
        name: 'sample',
        query: queryString,
        params,
        output: expectedResults
    }
]

const expected = [{ title: "Forrest Gump" }, { title: "Big" }]

test('run with returned nodes', async t => {
    const session = mockSessionFromQuerySet(querySet)
    const result = await run(
        session,
        queryString,
        params,
    )
    console.log(`result in test=${JSON.stringify(result, null, 2)}`);

    t.like(result[0], expected[0]);
    t.like(result[1], expected[1]);
})