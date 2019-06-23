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
const connectionString = "postgres://postgres:root@localhost:5432/mundiboxdb_v2";

//para produccion
// const connectionString = {
//   host: 'node45981-env-4469298.jl.serv.net.mx',
//   port: 5432,
//   database: 'mundiboxdb_v2',
//   user: 'webadmin',
//   password: 'BSRqbt55732'
// }; 

var pgp = require('pg-promise')(options);

var db = pgp(connectionString);

module.exports = db;







