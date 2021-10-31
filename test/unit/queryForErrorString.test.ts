import test from 'ava'
import { queryForErrorString } from '../../src/queryForErrorString';

const queryString = 'nothing'
const params = {
    foo: "a".repeat(1550),
    bar: 'cut off'
}

test('queryForErrorString', t => {
    const result = queryForErrorString(queryString, params)
    t.notRegex(result, /cut off/);
})