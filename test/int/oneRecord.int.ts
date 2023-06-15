import test from 'ava'

import { getSession } from '../../src/getSession'
import { oneRecord } from "../../src/index"

const userName = 'Me'
const platformId = 'us-east-1_kYI8RNIb1'

const queryString =
    `MATCH (user:User {name:$userNameOrEmail})-[:MEMBER_OF]->(platform:Platform {id:$platformId})
RETURN user.id AS userId, user.name AS userName, platform.id AS platformId`

const params = {
    userNameOrEmail: userName,
    platformId
}

const fieldList = ['userId', 'userName', 'platformId']

test('oneRecord', async (t:any) => {
    const session = await getSession()

    const result = await oneRecord(
        session,
        queryString,
        params,
        // fieldList

    )

    const expected = {
        "userId": "1cf90994-d154-4544-88d0-5f1398673381",
        "userName": "Me",
        "platformId": "us-east-1_kYI8RNIb1"
    }
    t.like(result, expected);
})