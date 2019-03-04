'use strict'
var db=require('./../bdd.coneccion');
const https = require('https')
 
function crudGarantia(req,res,next){
  var SQL = 'select * from  fun_ime_garantia($1, $2, $3,$4);';
  db.any(SQL,[req.body.idgarantia,req.body.idproveedor,req.body.descripcion, req.body.opcion])
  .then(function(data){
    res.status(200)
    .json(data);
  })
  .catch(function (err) {
    console.log(err);
    res.status(400).json(err)
  });
}


function getGarantias(req, res, next){
var page=req.body.page;
var itemsPerPage=req.body.itemsPerPage;
var page2=page*itemsPerPage;
console.log("getgarantias");

db.any('SELECT g.idgarantia, g.idproveedor, g.descripcion, g.estado, p.nombre nombreproveedor, p.estado estadoproveedor FROM garantia g join proveedor p on g.idproveedor = p.idproveedor where g.estado=1  LIMIT '+itemsPerPage+' OFFSET '+page2)
.then(function (data) {
  res.status(200)
    .json({
      status: 'success',
      data: data,
      message: 'Retrieved ALL tipos'
    });
})
.catch(function (err) {
  console.log(err);

  res.status(400).json(err)
});
}

function getTotalGarantias(req, res, next) {
  db.any("select count(*)  from garantia where estado=1")
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Se obtuvo el total de garantias'
        });
    })
    .catch(function (err) {
      console.log(err);
      res.status(400).json(err)
    });
}
function getListaProveedores(req,res,next){
  db.any('select * from proveedor where estado=1')
  .then(function(data){
    res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Se obtuvo los nombre de los proveedores'
        });
  })
  .catch(function (err) {
    console.log(err);
    res.status(400).json(err)
  });
}

function getGarantiaSelect(req, res, next){
  console.log(req.params.idproveedor);
  let idproveedor=req.params.idproveedor;
  db.any('select * from garantia where idproveedor='+idproveedor)
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'las garantias'
        });
    })
    .catch(function (err) {
      console.log(err);
      res.status(400).json(err)
    });
}

function postXXX(request,response,next){
  console.log(request.body.upc);
  var opts = {
    hostname: 'api.upcitemdb.com',
    path: '/prod/trial/lookup',
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    }
  }

  var req = https.request(opts, function(res,cb) {
    var body;
    console.log('statusCode: ', res.statusCode);
    console.log('headers: ', res.headers);
    res.on('data', function(d) {
      body=d;
      console.log('BODY: ' + d);

    })
    res.on('end', function() {
      console.log("end-xxxxxxxxxxxxxxxxxxxxxxxxxxxx");
      // var result=JSON.parse(d);
      cb(null,body);
    });
    
    })

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  })
  console.log("request.body:",request.body.upc);
  req.write(`{"upc":"${request.body.upc}"}`);
  
  req.end()
    
}

module.exports = {
  getGarantiaSelect:getGarantiaSelect,
  crudGarantia: crudGarantia,
  getGarantias:getGarantias,
  getListaProveedores:getListaProveedores,
  getTotalGarantias: getTotalGarantias,
  postXXX:postXXX

};
