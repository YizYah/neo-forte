import Session from 'neo4j-driver-core/types/session';
import { liveToData } from 'neo-forgery';
import { queryForErrorString } from './queryForErrorString';

const updateClauses = [
    'CREATE',
    'DELETE',
    'DETACH',
    'MERGE',
    'REMOVE',
    'SET',
]

const regexString = `.*(${updateClauses.join('|')}).*`

function isWriteTransaction(input: string): boolean {
    const upperCaseInput = input.toUpperCase()
    const isWriteRegex = new RegExp(regexString)
    return isWriteRegex.test(upperCaseInput)
    // return updateClauses.some((v: string) => upperCaseInput.includes(v))
}

export async function run(
    session: Session,
    queryString: string,
    params: any
) {
    let result: any
    try {
        if (isWriteTransaction(queryString)) {
            result = await session.writeTransaction(tx =>
                tx.run(queryString, params)
            )
        } else {
            result = await session.readTransaction(tx =>
                tx.run(queryString, params)
            )
        }
    } catch (err) {
        throw new Error(`problem calling the query: ${queryForErrorString}
        -------------------
        Here is the error reported: ${err}`);

    }

    try {
        return liveToData(result)
    } catch (err) {
        throw new Error(`problem converting to simple records the response to this query: : ${queryForErrorString}
        -------------------
        Here is the error reported: ${err}`);
    }

}
