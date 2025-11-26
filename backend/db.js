// db.js
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: "localhost",
  user: "root",          // change if needed
  password: "luna@111", // change
  database: "banana_app",         // MUST match the DB you created
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
