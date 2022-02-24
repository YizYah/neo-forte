import test from 'ava'

import {
    Format,
    getSession,
    getDefaultDatabaseInfo,
    getSessionVerify,
    oneRecord,
    run,
    TransactionType
} from '../../src'

test('index exports', t => {
    t.is(typeof getSession, 'function');
    t.is(typeof getSessionVerify, 'function');
    t.is(typeof getDefaultDatabaseInfo, 'function');
    t.is(typeof oneRecord, 'function');
    t.is(typeof run, 'function');
    t.is(Format.Complete, 1)
    t.is(Format.DataOnly, 0)
    t.is(TransactionType.Auto, 0)
    t.is(TransactionType.Read, 1)
    t.is(TransactionType.Write, 2)
})