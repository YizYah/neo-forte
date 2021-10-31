import Session from 'neo4j-driver-core/types/session';
import { queryForErrorString } from './queryForErrorString';

import { run } from './run';

export async function oneRecord(
    session: Session,
    queryString: string,
    params: any) {

    let result: any
    try {
        result = await run(session, queryString, params);
    } catch (err) {
        throw err
    }


    if (result.length > 1) {
        throw new Error(
            'More than one result was returned in a call for oneRecord.  One expected.'
            + queryForErrorString(queryString, params)
        );
    }
    if (result.length === 1) {
        return result[0]
    }
    return null;
}
