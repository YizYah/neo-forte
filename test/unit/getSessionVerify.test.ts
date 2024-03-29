import test from 'ava'


/*
   NOTE:
        this test has a failing--it doesn't confirm that
        when you use the process.env variables they get sent 
        properly into the call to neo4j.driver. I might 
        add that someday...
 */

const testURI = 'testDB_URI'
const testUSER = 'testDB_USER'
const testPASSWORD = 'testDB_PASSWORD'
const testDATABASE = 'testDB_DATABASE'


const databaseInfo = {
    URI: testURI,
    USER: testUSER,
    PASSWORD: testPASSWORD,
    DATABASE: testDATABASE
}


const databaseInfoNoDatabase = {
    URI: testURI,
    USER: testUSER,
    PASSWORD: testPASSWORD
}

const fakeSession = 'fake'
const driverFailConnectivity = (uri: string, auth: any) => {
    if (uri === testURI) return {
        verifyConnectivity: async () => true,
        session: () => fakeSession

    }
    return {
        verifyConnectivity: async () => {
            throw new Error('This will NEVER work!')
        },
        session: () => fakeSession
    }
}


const driverPassConnectivity = (uri: string, auth: any) => {
    if (uri === testURI) return {
        verifyConnectivity: async () => true,
        session: () => fakeSession

    }
    return {
        verifyConnectivity: async () => {
            return true
        },
        session: () => fakeSession
    }
}


const proxyquire = require('proxyquire')

let driverStub: any = driverFailConnectivity


const { getSessionVerify } = proxyquire('../../src/getSessionVerify', {
    'neo4j-driver': {
        driver: driverStub
    }
});


test('getSession', async (t: any) => {
    const result = await getSessionVerify(databaseInfo)
    t.is(result, fakeSession);
})

test('getSession without database', async (t: any) => {
    const result = await getSessionVerify(databaseInfoNoDatabase)
    t.is(result, fakeSession);
})


test.serial('getSession throws error when not valid connection', async (t: any) => {
    driverStub = driverFailConnectivity
    const failingConnection = {
        URI: 'wrong',
        USER: testUSER,
        PASSWORD: testPASSWORD
    }

    const error = await t.throwsAsync(async () => {
        await getSessionVerify(failingConnection)
    })

    t.regex(error.message, /This will NEVER work/);
})

test.serial('getSession throws error with no DB_URI', async (t: any) => {
    driverStub = driverPassConnectivity

    const env: any = process.env;
    process.env = {};

    const error = await t.throwsAsync(async () => {
        await getSessionVerify()

    })

        process.env = env;

    t.regex(error.message, /No DB_URI environment/);

})
