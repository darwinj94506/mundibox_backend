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


/*

const connectionString = {
  host: 'https://node45590-env-0992479.jl.serv.net.mx',
  port: 5432,
  database: 'mundiboxdb_v2',
  user: 'webadmin',
  password: 'RAMydg13977'
};

const connectionString = {
  host: 'node45590-env-0992479.jl.serv.net.mx',
  port: 5432,
  database: 'mundiboxdb_v2',
  user: 'webadmin',
  password: 'RAMydg13977'
}; 
var connectionString =  "postgres://webadmin:RAMydg13977@https://node45590-env-0992479.jl.serv.net.mx:5432/mundiboxdb_v2";
var connectionString =  "postgres://webadmin:RAMydg13977@node45590-env-0992479.jl.serv.net.mx:5432/mundiboxdb_v2";
var connectionString =  "postgres://webadmin:RAMydg13977@node45590-env-0992479.jl.serv.net.mx/mundiboxdb_v2";

LA QUE SI VALE LOCALMENTE
const connectionString = "postgres://postgres:root@localhost:5432/mundiboxdb_v2";
*/ 

console.log(process.env.PASSWORD_DB);
var pgp = require('pg-promise')(options);

var connectionString =  "postgres://postgres:root@node45590-env-0992479.jl.serv.net.mx:5432/mundiboxdb_v2";




var db = pgp(connectionString);

module.exports = db;







