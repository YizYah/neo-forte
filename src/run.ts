import Session from 'neo4j-driver-core/types/session';
import { liveToData } from 'neo-forgery';
import { queryForErrorString } from './queryForErrorString';
import { Format, TransactionType } from './types/settings';

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
    params: any,
    format: Format = Format.DataOnly,
    transactionType: TransactionType = TransactionType.Auto,
) {
    let result: any

    let finalTransactionType = transactionType
    if (transactionType === TransactionType.Auto) {
        finalTransactionType =
            isWriteTransaction(queryString) ?
                TransactionType.Write :
                TransactionType.Read
    }
    try {
        if (finalTransactionType === TransactionType.Write) {
            result = await session.writeTransaction(tx =>
                tx.run(queryString, params)
            )
        } else {
            result = await session.readTransaction(tx =>
                tx.run(queryString, params)
            )
        }
    } catch (err) {
        throw new Error(`problem calling the query: ${queryForErrorString(queryString, params)}
        -------------------
        Here is the error reported: ${err}`);

    }

    try {
        const records = liveToData(result)
        if (format === Format.DataOnly) {
            return records
        }
        const summary = { ...result.summary }
        return {
            records,
            summary
        }
    } catch (err) {
        throw new Error(`problem converting to simple records the response to this query: : ${queryForErrorString}
        -------------------
        Here is the error reported: ${err}`);
    }

}
