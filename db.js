const mysql = require("mysql");

const db = mysql.createConnection({
  host: "xmysql.jogomoleque.com.br",
  port: 3306,
  database: "jogomoleque1",
  user: "jogomoleque1",
  password: "Leiza*5751",
});

module.exports = db;
