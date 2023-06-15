/* eslint-disable  @typescript-eslint/no-non-null-assertion */

import { Session } from "neo4j-driver-core"
import { DatabaseInfo } from "./types/DatabaseInfo"

const neo4j = require('neo4j-driver')
const { getDefaultDatabaseInfo } = require('./getDefaultDatabaseInfo')

export async function getSessionVerify(databaseInfo?: DatabaseInfo): Promise<Session> {
  let finalDatabaseInfo = databaseInfo
  if (!databaseInfo) {
    try {
      finalDatabaseInfo = getDefaultDatabaseInfo()
    } catch (error) {
      throw new Error(`problem calling getSession: ${error}`)
    }
  }

  const driver = neo4j.driver(
    finalDatabaseInfo!.URI,
    neo4j.auth.basic(
      finalDatabaseInfo!.USER,
      finalDatabaseInfo!.PASSWORD
    )
  )

  try {
    await driver.verifyConnectivity()
  } catch (err) {
    throw new Error(`DatabaseError: connectivity verification failed. ${err}`)
  }
  if (finalDatabaseInfo && finalDatabaseInfo.DATABASE){
    return driver.session({database: finalDatabaseInfo.DATABASE});
  } 
  return driver.session();
  
}