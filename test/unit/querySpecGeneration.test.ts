import test from 'ava'
import * as fs from 'fs'
import * as path from 'path'
import { mockSessionFromQuerySet, QuerySpec, wrapCopiedResults } from 'neo-forgery'
import { run } from '../../src/run'

const queryString = `match (movie:Movie)-[:ACTED_IN]-(actor:Person {name: $actor}) return movie.title as title`
const params = { actor: 'Tom Hanks' }

const records = [
    {
        "keys": ["title"],
        "length": 1,
        "_fields": ["Forrest Gump"],
        "_fieldLookup": { "title": 0 }
    },
    {
        "keys": ["title"],
        "length": 1,
        "_fields": ["Big"],
        "_fieldLookup": { "title": 0 }
    }
]

const expectedResults = wrapCopiedResults(records, { foo: "bar" })

const querySpec: QuerySpec = {
    name: 'sample',
    query: queryString,
    params,
    output: expectedResults
}

const querySet: QuerySpec[] = [querySpec]

// Store original environment
const originalEnv = process.env.QUERY_SPECS_FILE

test.beforeEach(() => {
    // Clean up environment variable before each test
    delete process.env.QUERY_SPECS_FILE
})

test.afterEach(() => {
    // Clean up environment variable after each test
    if (originalEnv) {
        process.env.QUERY_SPECS_FILE = originalEnv
    } else {
        delete process.env.QUERY_SPECS_FILE
    }
})

test.serial('run does not write query spec when QUERY_SPECS_FILE is not set', async (t: any) => {
    delete process.env.QUERY_SPECS_FILE
    const testFile = `/tmp/test_query_specs_not_set_${Date.now()}.ts`
    
    const session = mockSessionFromQuerySet(querySet)
    await run(session, queryString, params)
    
    // File should not be created
    t.false(fs.existsSync(testFile))
})

test.serial('run writes query spec when QUERY_SPECS_FILE is set', async (t: any) => {
    const testFile = `/tmp/test_query_specs_${Date.now()}.ts`
    process.env.QUERY_SPECS_FILE = testFile
    
    const session = mockSessionFromQuerySet(querySet)
    await run(session, queryString, params)
    
    // File should be created
    t.true(fs.existsSync(testFile))
    
    // Read and verify content
    const content = fs.readFileSync(testFile, 'utf8')
    
    t.true(content.includes("import { QuerySpec } from 'neo-forgery';"))
    t.true(content.includes('export const generatedQuerySpecs: QuerySpec[] = ['))
    t.true(content.includes(queryString))
    t.true(content.includes('"actor": "Tom Hanks"'))
    t.true(content.includes('generated_spec'))
    
    // Clean up
    fs.unlinkSync(testFile)
})

test.serial('run appends to existing query spec file', async (t: any) => {
    const testFile = `/tmp/test_query_specs_append_${Date.now()}.ts`
    process.env.QUERY_SPECS_FILE = testFile
    
    // First run
    const session1 = mockSessionFromQuerySet(querySet)
    await run(session1, queryString, params)
    
    // Second run with different query
    const queryString2 = `match (n:Node) return n.name as name`
    const params2 = { limit: 10 }
    const records2 = [{
        "keys": ["name"],
        "length": 1,
        "_fields": ["test"],
        "_fieldLookup": { "name": 0 }
    }]
    const expectedResults2 = wrapCopiedResults(records2, { bar: "baz" })
    const querySpec2: QuerySpec = {
        name: 'second',
        query: queryString2,
        params: params2,
        output: expectedResults2
    }
    const querySet2: QuerySpec[] = [querySpec2]
    const session2 = mockSessionFromQuerySet(querySet2)
    await run(session2, queryString2, params2)
    
    const content = fs.readFileSync(testFile, 'utf8')
    
    // Should contain both queries
    t.true(content.includes(queryString))
    t.true(content.includes(queryString2))
    t.true(content.includes('"actor": "Tom Hanks"'))
    t.true(content.includes('"limit": 10'))
    
    // Should only have one import and export statement
    const importMatches = content.match(/import { QuerySpec } from 'neo-forgery';/g)
    const exportMatches = content.match(/export const generatedQuerySpecs: QuerySpec\[\] = \[/g)
    t.is(importMatches?.length, 1)
    t.is(exportMatches?.length, 1)
    
    // Clean up
    fs.unlinkSync(testFile)
})

test.serial('run handles file creation in non-existent directory', async (t: any) => {
    const testDir = `/tmp/non_existent_dir_${Date.now()}`
    const testFile = path.join(testDir, 'query_specs.ts')
    process.env.QUERY_SPECS_FILE = testFile
    
    const session = mockSessionFromQuerySet(querySet)
    await run(session, queryString, params)
    
    // Directory and file should be created
    t.true(fs.existsSync(testDir))
    t.true(fs.existsSync(testFile))
    
    const content = fs.readFileSync(testFile, 'utf8')
    t.true(content.includes(queryString))
    
    // Clean up
    fs.unlinkSync(testFile)
    fs.rmdirSync(testDir)
})

test.serial('run continues normally when file write fails', async (t: any) => {
    // Set an invalid file path (directory that can't be created)
    process.env.QUERY_SPECS_FILE = '/root/invalid/path/query_specs.ts'
    
    const session = mockSessionFromQuerySet(querySet)
    
    // Should not throw an error, just continue with normal execution
    const result = await run(session, queryString, params)
    
    t.is(result.length, 2)
    t.is(result[0].title, "Forrest Gump")
    t.is(result[1].title, "Big")
})