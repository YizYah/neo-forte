import Session from 'neo4j-driver-core/types/session';
import { liveToData } from 'neo-forgery';
import { queryForErrorString } from './queryForErrorString';

export async function run(
    session: Session,
    queryString: string,
    params: any
) {
    let result: any
    try {
        result = await session.run(queryString, params);        
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
