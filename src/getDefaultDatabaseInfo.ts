require('dotenv').config()

export function getDefaultDatabaseInfo() {
  const defaultUri = process.env.DB_URI;
  const defaultUser = process.env.DB_USER;
  const defaultPassword = process.env.DB_PASSWORD;

  if (!('DB_URI' in process.env))
    throw new Error('No DB_URI environment variable found, and no databaseInfo provided');
  if (!('DB_USER' in process.env))
    throw new Error('No DB_USER environment variable found, and no databaseInfo provided');
  if (!('DB_PASSWORD' in process.env))
    throw new Error('No DB_PASSWORD environment variable found, and no databaseInfo provided');

  return {
    URI: defaultUri,
    USER: defaultUser,
    PASSWORD: defaultPassword
  };
}
