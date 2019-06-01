var promise = require('bluebird');
var options = {
  promiseLib: promise,
  error: function (error, e) {
    if (e.cn) {
        // A connection-related error;
        console.log("CN:", e.cn);
        console.log("EVENT:", error.message);
    }
}
};

var pgp = require('pg-promise')(options);
var URL =  "postgres://webadmin:35v6x9Qds2@192.168.3.182:5432/mundiboxdb_v2";
// DriverManager.getConnection(URL, darwin, darwin123);
// const connectionString = "postgres://postgres:root@localhost:5432/mundiboxdb_v2";

const connectionString = {
  host: '192.168.3.182',
  port: 5432,
  database: 'mundiboxdb_v2',
  user: 'webadmin',
  password: '35v6x9Qds2'
};

var db = pgp(URL);

module.exports = db;







