import test from 'ava'

import { getDefaultDatabaseInfo } from '../../src/getDefaultDatabaseInfo';

const env = Object.assign({}, process.env);

test.after(() => {
    Object.entries(env).forEach(([key, value]) => {
        if (key !== undefined) {
            process.env[key] = value
        }
    })
});

const tempUri = 'tempURI'
const tempUser = 'tempUser'
const tempPassword = 'tempPassword'


test.serial('getDefaultDatabaseInfo', t => {
    process.env.DB_URI = tempUri
    process.env.DB_USER = tempUser
    process.env.DB_PASSWORD = tempPassword

    const expected = {
        URI: tempUri,
        USER: tempUser,
        PASSWORD: tempPassword,
        DATABASE: undefined
    }
    const result = getDefaultDatabaseInfo()
    t.deepEqual(result, expected)
})

test.serial('getDefaultDatabaseInfo error for no Uri', t => {

    delete process.env['DB_URI']
    process.env.DB_USER = tempUser
    process.env.DB_PASSWORD = tempPassword

    const error = t.throws(() => {
        getDefaultDatabaseInfo()
    })

    t.regex(error.message, /No DB_URI environment/);
})

test.serial('getDefaultDatabaseInfo error for no temp user', t => {

    process.env.DB_URI = tempUri
    delete process.env['DB_USER']
    process.env.DB_PASSWORD = tempPassword

    const error = t.throws(() => {
        getDefaultDatabaseInfo()
    })

    t.regex(error.message, /No DB_USER environment/);
})

test.serial('getDefaultDatabaseInfo error for no temp password', t => {

    process.env.DB_URI = tempUri
    process.env.DB_USER = tempUser
    delete process.env['DB_PASSWORD']

    const error = t.throws(() => {
        getDefaultDatabaseInfo()
    })

    t.regex(error.message, /No DB_PASSWORD environment/);
})