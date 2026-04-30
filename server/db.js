// Database connection module
// This avoids circular dependencies when services need database access

let sqliteDb = null;
let mysqlConnection = null;

function setSQLiteDb(db) {
  sqliteDb = db;
}

function setMySQLConnection(conn) {
  mysqlConnection = conn;
}

function getSQLiteDb() {
  return sqliteDb;
}

function getMySQLConnection() {
  return mysqlConnection;
}

module.exports = {
  setSQLiteDb,
  setMySQLConnection,
  getSQLiteDb,
  getMySQLConnection
};
