import Session from 'neo4j-driver-core/types/session';
import { liveToData } from 'neo-forgery';
import { queryForErrorString } from './queryForErrorString';


/*
tx =>
    tx.run('MATCH (p:Product) WHERE p.id = $id RETURN p.title', { id: 0 })
*/

export async function run(
    session: Session,
    queryString: string,
    params: any
) {
    let result: any
    try {
        result = await session.readTransaction(tx =>
            tx.run(queryString, params)
          )        
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
