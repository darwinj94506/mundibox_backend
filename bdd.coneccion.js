var promise = require('bluebird');
var options = {
  promiseLib: promise,
  error: function (error, e) {
    if (e.cn) {
        // A connection-related error;
        console.log("CN:", e.cn);
        console.log("EVENT:", error.message);
        console.log(error)
    }
}
};


//para desarrollo
// const connectionString = "postgres://postgres:root@localhost:5432/mundiboxdb_v2";
//para produccion
const connectionString = {
  host: 'node46973-ventasmundibox.jl.serv.net.mx',
  port: 5432,
  database: 'mundiboxdb_v2',
  user: 'webadmin',
  password: 'VBIdzp30919'
}; 

var pgp = require('pg-promise')(options);

var db = pgp(connectionString);

module.exports = db;







