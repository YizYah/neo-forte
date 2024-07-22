/* eslint-disable  @typescript-eslint/no-non-null-assertion */

import { Session } from "neo4j-driver-core"
import { DatabaseInfo } from "./types/DatabaseInfo"
import { Config } from "neo4j-driver"

const neo4j = require('neo4j-driver')
const { getDefaultDatabaseInfo } = require('./getDefaultDatabaseInfo')

export function getSession(databaseInfo?: DatabaseInfo, config?: Config): Session {
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
    ),
    config,
  )

  if (finalDatabaseInfo && finalDatabaseInfo.DATABASE) {
    return driver.session({ database: finalDatabaseInfo.DATABASE });
  }
  return driver.session();

}