'use strict'
var db=require('./../bdd.coneccion');

 function findPublicaciones(req, res) {
    const queryParams = req.body;
    const filter = queryParams.filter || '',
          sortOrder = queryParams.sortOrder,
          pageNumber = parseInt(queryParams.pageNumber) || 0,
          pageSize = parseInt(queryParams.pageSize);
    var nitems=pageNumber*pageSize;
          db.any('SELECT * FROM publicacion p  LIMIT '+pageSize+' OFFSET '+nitems)
          .then(function (data) {
            var items=data;
              db.any("select count(*)  from publicacion")
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


function crudPublicacion(req,res,next){
  var SQL = 'select * from  fun_ime_publicacion($1,$2,$3,$4,$5,$6,$7);';
  console.log([
    req.body.idpublicacion,
    req.body.idusuario,
    req.body.plataforma, 
    req.body.idplataforma,
    req.body.fechavencimiento,
    req.body.idproducto, 
    req.body.opcion
  ]);
  db.any(SQL,[
    req.body.idpublicacion,
    req.body.idusuario,
    req.body.plataforma, 
    req.body.idplataforma,
    req.body.fechavencimiento,
    req.body.idproducto, 
    req.body.opcion,
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
  crudPublicacion:crudPublicacion,
  findPublicaciones:findPublicaciones
};
