import { DAYS_0000_TO_1970 } from "neo4j-driver-core/types/internal/temporal-util"

/* eslint-disable no-undef */
require('dotenv').config()

const databaseInfo = {
  URI: process.env.DB_URI,
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASSWORD
}

module.exports = databaseInfo
