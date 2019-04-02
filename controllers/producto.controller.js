'use strict'
var db = require('./../bdd.coneccion');

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
    db.any('SELECT * FROM producto p where p.codigofabricante=$1', [codigo])
        // .then(function (data) {
        //   res.status(200).json({
        //     result:'OK',
        //     items:data
        //   })              
        // })
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
            db.any("select count(*)  from producto")
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
        null,
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
            null,
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


module.exports = {
    crudProducto: crudProducto,
    findProductos: findProductos,
    findProductoByCodigoFabricante: findProductoByCodigoFabricante,
    findProductosByImportacion: findProductosByImportacion,
    getMaterialesSelect2: getMaterialesSelect2
};