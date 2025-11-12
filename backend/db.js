import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: "localhost",
  user: "root",           // change if needed
  password: "luna@111", // your MySQL password
  database: "banana_app",
});
