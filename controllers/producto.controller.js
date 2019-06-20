'use strict'
var db = require('./../bdd.coneccion');
var fs =require('fs');
 var path=require('path');


function findProductosByImportacion(req, res) {
    const queryParams = req.body;
    const filter = queryParams.filter || '',
        sortOrder = queryParams.sortOrder,
        pageNumber = parseInt(queryParams.pageNumber) || 0,
        pageSize = parseInt(queryParams.pageSize),
        idimportacion = queryParams.idimportacion;
    var nitems = pageNumber * pageSize;

    db.any('select p.codigo _codigo, p.codigofabricante _codigofabricante,p.descripcion _descripcion,ip.idimportacionproducto,ip.idproducto,ip.idimportacion,ip.cantidad from producto p  join importacion_producto ip on p.idproducto=ip.idproducto  where ip.idimportacion=' + idimportacion + 'LIMIT ' + pageSize + ' OFFSET ' + nitems)
        .then(function(data) {
            var items = data;
            db.any("select count(*)  from importacion_producto ip where ip.idimportacion=" + idimportacion)
                .then(function(total) {
                    res.status(200)
                        .json({
                            items: items,
                            totalCount: total[0].count
                        });
                })
                .catch(function(err) {
                    console.log(err);
                    res.status(400).json({
                        result: 'ERROR',
                        message: err
                    })
                });
        })
        .catch(function(err) {
            console.log(err);
            res.status(400).json({
                result: 'ERROR',
                message: err
            })
        });
}

function findProductoByCodigoFabricante(req, res) {
    const codigo = req.params.codigofabricante;
    console.log(codigo);
    db.any('SELECT * FROM producto p where p.codigofabricante=$1 and p.estado=1', [codigo])
        .then(function(data) {
            res.status(200).json(data[0])
        })
        .catch(function(err) {
            // console.log(err);
            res.status(400).json({
                result: 'ERROR',
                message: err[0]
            })
        });
}
/*esta funcion se utiliza para la parte de la facturacion (detalle.component)cuando se guarda todo el cuerpo de la factura se hace una 
consulta del stock de todos los productos de la factura para actualizar el stock de mercado libre con el stock actual de mi bdd
 */
function findProductosByCodigoFabricante(req, res) {
    const codigo = req.params.codigofabricante;
    console.log(codigo);
    db.any('SELECT * FROM producto_stock p where p.codigofabricante=$1', [codigo])
        .then(function(data) {
            res.status(200).json(data[0])
        })
        .catch(function(err) {
            // console.log(err);
            res.status(400).json({
                result: 'ERROR',
                message: err[0]
            })
        });
}


function findProductos(req, res) {
    const queryParams = req.body;
    const filter = queryParams.filter || '',
        sortOrder = queryParams.sortOrder,
        pageNumber = parseInt(queryParams.pageNumber) || 0,
        pageSize = parseInt(queryParams.pageSize);
    var nitems = pageNumber * pageSize;

    db.any('SELECT * FROM producto_stock p  LIMIT ' + pageSize + ' OFFSET ' + nitems)
        .then(function(data) {
            var items = data;
            db.any("select count(*)  from producto p where p.estado=1")
                .then(function(total) {
                    res.status(200)
                        .json({
                            items: items,
                            totalCount: total[0].count
                        });
                })
                .catch(function(err) {
                    console.log(err);
                    res.status(400).json({
                        result: 'ERROR',
                        message: err[0]
                    })
                });
        })
        .catch(function(err) {
            console.log(err);
            res.status(400).json({
                result: 'ERROR',
                message: err[0]
            })
        });
}


function crudProducto(req, res, next) {
    var SQL = 'select * from  fun_ime_producto($1, $2, $3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13);';
    console.log([
        req.body.idproducto,
        req.body.idtipo,
        req.body.descripcion,
        req.body.precio1,
        req.body.precio2,
        req.body.precio3,
        req.body.costo,
        req.body.codigofabricante,
        req.body.preciofacturar,
        req.body.preciomercadolibre,
        req.body.titulo,
        req.body.imagenes,
        req.body.opcion

    ]);



    db.any(SQL, [
            req.body.idproducto,
            req.body.idtipo,
            req.body.descripcion,
            req.body.precio1,
            req.body.precio2,
            req.body.precio3,
            req.body.costo,
            req.body.codigofabricante,
            req.body.preciofacturar,
            req.body.preciomercadolibre,
            req.body.titulo,
            req.body.imagenes,
            req.body.opcion
        ])
        .then(function(data) {
            res.status(200)
                .json(data[0]);
        })
        .catch(function(err) {
            console.log(err);
            res.status(400).json(err[0])
        });
}

function getMaterialesSelect2(req, res, next) {
    console.log(db);
    db.any('select * from producto')
        .then(function(data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Retrieved ALL tipos'
                });
        })
        .catch(function(err) {
            console.log(err);
            res.status(400).json(err)
        });
}
//----------------------------------------------------------------------------------------
// function uploadImage(req,res, next){
//     var productoId=req.params.id;
//     var file_name='no subido...';
//     console.log(req.files);
//     var imagenes=req.files.image;
//     if(req.files.image){
//         var imagenes=req.files.image;
//         var sum=0;
//         var imgs=[];
//         imagenes.forEach((file,index)=>{
//             var file_path=file.path;
//             var file_split=file_path.split('\\'); //almacena solo el nombre del fichero
//             var file_name=file_split[2];
//             var ext_split=file_name.split('\.');
//             var file_ext=ext_split[1];
//             if(file_ext=='png'|| file_ext=='jpg' || file_ext=='jpeg' || file_ext=='gif'){
//             // if(userId != req.user.sub){
//             //   return res.status(500).send({message:'no tiene permiso para actualizar el usuario'});
//             // }
//             imgs.push(file_name);
//             if(index==imagenes.length-1){
//                 // una vez subidas las imagenes al servidor actualiza el producto con el array de imgs subidas
//                 var SQL = 'UPDATE PRODUCTO SET imagenes = $2 WHERE idproducto = $1';
//                 db.any(SQL, [
//                         productoId,
//                         imgs
//                     ])
//                     .then(function(data) {
//                         res.status(200)
//                             .json(imgs);
//                     })
//                     .catch(function(err) {
//                         console.log(err);
//                         res.status(400).json(err[0])
//                     });
//                         //---------------------------------------
//                     }       
//             }else{
//             fs.unlink(file_path,(err)=>{
//                 if(err){
//                 res.status(200).send({message:'extension no valida y fichero no borrado'});
//                 }else{
//                 res.status(200).send({message:'extension no valida'});
//                 }
//             });
    
//             }

//         })
      

//     }else{
//         res.status(200).send({message:'no se ha subido archivos'});
//     }
//   }
function uploadImage(req,res, next){
    var file_name='no subido...';
    console.log(req.files);
    var imagenes=req.files.image;
    if(req.files.image){
        var imagenes=req.files.image;
        var sum=0;
        var file_path=req.files.image.path;
        //comentar para desarrollo
        // var file_split=file_path.split('\\'); 
        //descomentar para produccion
        var file_split=file_path.split('/');

        var file_name=file_split[2];
        var ext_split=file_name.split('\.');
        var file_ext=ext_split[1];
        // if(file_ext=='png'|| file_ext=='jpg' || file_ext=='jpeg' || file_ext=='gif'){
            // if(userId != req.user.sub){
            //   return res.status(500).send({message:'no tiene permiso para actualizar el usuario'});
            // }
                // una vez subidas las imagenes al servidor actualiza el producto con el array de imgs subidas
                res.status(200).json(file_name);
                //---------------------------------------
                 
        //     }else{
        //     fs.unlink(file_path,(err)=>{
        //         if(err){
        //         res.status(200).send({message:'extension no valida y fichero no borrado'});
        //         }else{
        //         res.status(200).send({message:'extension no valida'});
        //         }
        //     });
        // }

    }else{
        res.status(200).send({message:'no se ha subido archivos'});
    }
  }

  function getImageFile(req,res){
    var imageFile=req.params.imageFile;
    var path_file='./public/images/'+imageFile;
  
    fs.exists(path_file,function(exists){
      if(exists){
        console.log("si existe y te mando");
        res.sendFile(path.resolve(path_file));
      }else{
        res.status(404).send({message:'No existe esta imagen'});
        console.log('no existe esta imagen no insista');
      }
    });
  }


//----------------------------------------------------------------------------------------


module.exports = {
    crudProducto: crudProducto,
    findProductos: findProductos,
    findProductoByCodigoFabricante: findProductoByCodigoFabricante,
    findProductosByImportacion: findProductosByImportacion,
    getMaterialesSelect2: getMaterialesSelect2,
    uploadImage:uploadImage,
    getImageFile:getImageFile,
    findProductosByCodigoFabricante:findProductosByCodigoFabricante
};