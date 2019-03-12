'use strict'
var db=require('./../bdd.coneccion');


 function findImportaciones(req, res) {
    const queryParams = req.body;
    const filter = queryParams.filter || '',
          sortOrder = queryParams.sortOrder,
          pageNumber = parseInt(queryParams.pageNumber) || 0,
          pageSize = parseInt(queryParams.pageSize);
    var nitems=pageNumber*pageSize;
        
          db.any('SELECT * FROM importacion i  LIMIT '+pageSize+' OFFSET '+nitems)
          .then(function (data) {
            var items=data;
              db.any("select count(*)  from importacion")
              .then(function (total) {
                  res.status(200)
                  .json({
                    items:items,
                    totalCount:total[0].count
                  }      
                );  
              })
              .catch(function (err) {
                console.log(err);
                res.status(400).json({
                  result:'ERROR',
                  message:err[0]
                })
              });
          })
          .catch(function (err) {
            console.log(err);
            res.status(400).json({
              result:'ERROR',
              message:err[0]
            })
          });         
}

function findImportacionById(req,res){
  const idimportacion=req.params.idimportacion;
  db.any('SELECT * FROM importacion i where i.idimportacion=$1',[idimportacion])
          .then(function (data) {
            // res.status(200).json({
            //   result:'OK',
            //   item:data[0]
            // })              
            res.status(200).json(
                data[0]
              )       
          })
          .catch(function (err) {
            // console.log(err);
            res.status(400).json({
              result:'ERROR',
              message:err[0]
            })
          });         
}


function crudImportacion(req,res,next){
  var SQL = 'select * from  fun_ime_importacion($1, $2, $3,$4,$5);';
  console.log([
    req.body.idimportacion,
    req.body.idusuario,
    req.body.fecha, 
    req.body.descripcion,
    req.body.opcion
  ]);



  db.any(SQL,[
    req.body.idimportacion,
    req.body.idusuario,
    req.body.fecha, 
    req.body.descripcion,
    req.body.opcion
  ])
  .then(function(data){
    res.status(200)
    .json(data[0]);
  })
  .catch(function (err) {
    console.log(err);
    res.status(400).json(err[0])
  });
}

module.exports = {
  crudImportacion:crudImportacion,
  findImportaciones:findImportaciones,
  findImportacionById:findImportacionById

};
