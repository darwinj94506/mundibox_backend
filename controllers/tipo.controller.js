'use strict'
var db = require('./../bdd.coneccion');

function getTiposSelect(req, res, next) {
    console.log(db);
    db.any('select * from tipo where estado=1')
        .then(function(data) {
            console.log(data);
            res.status(200)
                .json(data);
        })
        .catch(function(err) {
            console.log(err);
            res.status(400).json(err)
        });
}

function getTipo(req, res, next) {
    console.log(req);
    let id = req.params.id;
    db.any('select * from tipo where idtipo=' + id)
        .then(function(data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'se optuvo el material'
                });
        })
        .catch(function(err) {
            console.log(err);
            res.status(400).json(err)
        });
}

function findTipos(req, res) {
    const queryParams = req.body;
    const filter = queryParams.filter || '',
        sortOrder = queryParams.sortOrder,
        pageNumber = parseInt(queryParams.pageNumber) || 0,
        pageSize = parseInt(queryParams.pageSize);
    var nitems = pageNumber * pageSize;

    db.any('SELECT * FROM tipo where estado=1 LIMIT ' + pageSize + ' OFFSET ' + nitems)
        .then(function(data) {
            var items = data;
            db.any("select count(*)  from tipo where estado=1")
                .then(function(total) {
                    res.status(200)
                        .json({
                            result: 'OK',
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

function crudTipo(req, res, next) {
    console.log([req.body.idtipo, req.body.nombre, req.body.estado, req.body.fecha]);
    var SQL = 'select * from  fun_ime_tipo($1, $2,$3);';
    db.any(SQL, [req.body.idtipo, req.body.nombre, req.body.opcion])
        .then(function(data) {
            res.status(200)
                .json(data);
        })
        .catch(function(err) {
            console.log(err);
            res.status(400).json(err)
        });
}

module.exports = {
    getTiposSelect: getTiposSelect,
    getTipo: getTipo,
    crudTipo: crudTipo,
    findTipos: findTipos
};