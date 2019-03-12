'use strict'
var db=require('./../bdd.coneccion');

//********************************************************************************************************************
function findProductosByImportacion(req,res){
  const queryParams = req.body;
  const filter = queryParams.filter || '',
        sortOrder = queryParams.sortOrder,
        pageNumber = parseInt(queryParams.pageNumber) || 0,
        pageSize = parseInt(queryParams.pageSize),
        idimportacion=queryParams.idimportacion;

  var nitems=pageNumber*pageSize;
        
  db.any('select p.codigo _codigo, p.codigofabricante _codigofabricante,p.descripcion _descripcion,ip.idimportacionproducto,ip.idproducto,ip.idimportacion,ip.cantidad from producto p  join importacion_producto ip on p.idproducto=ip.idproducto  where ip.idimportacion='+idimportacion+'LIMIT '+pageSize+' OFFSET '+nitems)
  .then(function (data) {
    var items=data;
      db.any("select count(*)  from importacion_producto ip where ip.idimportacion="+idimportacion)
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
          message:err
        })
      });
  })
  .catch(function (err) {
    console.log(err);
    res.status(400).json({
      result:'ERROR',
      message:err
    })
  });      
}

function crudImportacionProducto(req,res,next){
  var SQL = 'select * from  fun_ime_importacion_producto($1, $2, $3,$4,$5);';
  console.log([
    req.body.idimportacionproducto,
    req.body.idimportacion, 
    req.body.idproducto,
    req.body.cantidad,
    req.body.opcion
  ]);

  db.any(SQL,[
    req.body.idimportacionproducto,
    req.body.idimportacion, 
    req.body.idproducto,
    req.body.cantidad,
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


//*********************************************************************************************************************



module.exports = {
  crudImportacionProducto: crudImportacionProducto,
  findProductosByImportacion:findProductosByImportacion
};
