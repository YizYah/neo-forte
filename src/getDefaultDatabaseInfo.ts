import { DatabaseInfo } from "./types/DatabaseInfo";

require('dotenv').config()

export function getDefaultDatabaseInfo(): DatabaseInfo {
  const defaultUri = process.env.DB_URI;
  const defaultUser = process.env.DB_USER;
  const defaultPassword = process.env.DB_PASSWORD;
  const defaultDatabase = process.env.DB_DATABASE;

  if (!defaultUri)
    throw new Error('No DB_URI environment variable found, and no databaseInfo provided');
  if (!defaultUser)
    throw new Error('No DB_USER environment variable found, and no databaseInfo provided');
  if (!defaultPassword)
    throw new Error('No DB_PASSWORD environment variable found, and no databaseInfo provided');

  return {
    URI: defaultUri,
    USER: defaultUser,
    PASSWORD: defaultPassword,
    DATABASE: defaultDatabase
  };
}
