'use strict'
var db = require('./../bdd.coneccion');

function getTotalEgresos(req, res, next) {
    db.any("select count(*)  from egreso")
        .then(function(data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'transacción exitosa'
                });
        })
        .catch(function(err) {
            return next(err);
        });
}

function getStock(req, res, next) {
    console.log(req.params.idmaterial);

    db.any("select stock from material_stock where idmaterial=" + req.params.idmaterial)
        .then(function(data) {
            console.log(data);
            res.status(200)
            data: data
        })
        .catch(function(err) {
            console.log(err);
            res.status(500).json(err)
        });
}

function validarDetalle(req, res, next) {
    var cuerpo = req.body;
    console.log(JSON.stringify(cuerpo));
    var lista = '';
    for (var i in cuerpo) {
        lista += 'select ' + cuerpo[i].idproducto + '::integer idproducto, ' + cuerpo[i].cantidad + '::integer cantidad';
        if (i == (cuerpo.length - 1)) {
            lista += ';';
        } else {
            lista += ' union ';
        }
        if (i == (cuerpo.length - 1)) {
            db.any('select * from fun_ime_detalle_egreso_stock($1,$2);', [lista, cuerpo.length])
                .then(function(data) {
                    console.log(data);
                    res.status(200)
                        .json({
                            _info_id: data[0]._info_id,
                            _info_titulo: data[0]._info_titulo,
                            _info_desc: data[0]._info_desc,
                            _info_lista: JSON.parse(data[0]._info_lista)
                        });
                })
                .catch(function(err) {
                    console.log(err);
                    res.status(500).json(err)
                });
        }
    }
}



function getDetalleEgreso(req, res, next) {
    var page = req.body.page;
    console.log(req.params.idegreso);
    db.any('SELECT producto.titulo, producto.idproducto, producto.codigo, producto.codigofabricante, d.cantidad, d.preciounitario, e.idegreso, e.total, e.idusuario, e.iva, u.nombres, u.apellidos, u.cedula, u.direccion,e.fecha FROM detalle_egreso d JOIN producto ON producto.idproducto = d.idproducto JOIN egreso e ON e.idegreso = d.idegreso JOIN usuario u ON u.idusuario=e.idsolicitante WHERE d.idegreso = $1', req.params.idegreso)
        .then(function(data) {
            res.status(200)
                .json({
                    data: data,
                });
        })
        .catch(function(err) {
            res.status(500).json(err)
        });
}

function getEgresosPaginacion(req, res, next) {
    console.log(req.body);
    var page = req.body.page;
    var itemsPerPage = req.body.itemsPerPage;
    console.log(page);
    console.log(itemsPerPage);
    var page2 = page * itemsPerPage;
    console.log(page2);
    db.any('select e.idegreso, e.idusuario, u.nombres nombresusuario, u.apellidos apellidosusuario ,e.idsolicitante,s.nombres nombres, s.apellidos apellidos,s.direccion,s.telefono,s.correo,s.ciudad,s.cedula,s.referencia, e.fecha, e.observacion, e.estado, e.total, e.iva from egreso e join usuario u on e.idusuario = u.idusuario join usuario s on e.idsolicitante = s.idusuario ORDER BY e.idegreso DESC LIMIT ' + itemsPerPage + ' OFFSET ' + page2)
        .then(function(data) {
            res.status(200)
                .json({
                    data: data
                });
        })
        .catch(function(err) {
            console.log(err);
            res.status(500).json(err)
        });
}

function getDetalles(req, res, next) {
    console.log('req.params.idegreso');
    console.log(req.params);
    db.any('SELECT material.nombre, material.idmaterial, sum(detalle_egreso.cantidad) FROM detalle_egreso JOIN ingreso ON ingreso.idingreso = detalle_egreso.idingreso JOIN material ON material.idmaterial = ingreso.idmaterial WHERE detalle_egreso.idegreso = $1 group by material.idmaterial, material.nombre', req.params.idegreso)
        .then(function(data) {
            res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'transción exitosa'
                });
        })
        .catch(function(err) {
            res.status(500).json(err)
        });
}

function crudEgreso(req, res, next) {
    console.log(req.user);
    console.log(req.user.idusuario); //esto viene de middleware autheticated.js
    var SQL = 'select * from  fun_ime_egreso($1, $2, $3, $4, $5, $6,$7);';
    console.log([req.body.idegreso, req.body.idusuario, req.body.idsolicitante,req.body.total,
        req.body.observacion, req.body.iva, 0, req.body.opcion
    ]);
    db.any(SQL, [req.body.idegreso, req.user.idusuario, req.body.idsolicitante,
            req.body.observacion, req.body.iva, req.body.total, req.body.opcion
        ]).then(function(data) {
            res.status(200)
                .json(data);
        })
        .catch(function(err) {
            console.log(err);
            res.status(500).json(err)
        });
}

function crudDetalle(req, res, next) {
    var body = req.body;
    console.log([body.iddetalle, body.idegreso, body.idproducto, body.cantidad, body.precio, body.opcion]);
    var SQL = 'select * from  fun_ime_detalle_egreso($1, $2, $3, $4, $5,$6);';
    db.any(SQL, [body.iddetalle, body.idegreso, body.idproducto, body.cantidad, body.precio, body.opcion]).then(function(data) {
            res.status(200)
                .json(data);
        })
        .catch(function(err) {
            console.log(err);
            res.status(500).json(err)
        });
}

function crudDetalle2(req, res, next) {
    var cuerpo = req.body;
    var lista = '';
    for (var i in cuerpo) {
        lista += 'select ' + cuerpo[i].idegreso + '::integer idegreso,' + cuerpo[i].idingreso + '::integer idingreso,' + cuerpo[i].cantidad + '::integer cantidad,' + cuerpo[i].opcion + '::integer opcion,' + cuerpo[i].idmaterial + '::integer idmaterial';
        if (i == (cuerpo.length - 1)) {
            lista += ';';
        } else {
            lista += ' union ';
        }

        if (i == (cuerpo.length - 1)) {
            console.log(lista);
            db.any('select * from  fun_ime_detalle_egreso2($1, $2);', [lista, cuerpo.length])
                .then(function(data) {

                    res.status(200)
                        .json(data);
                })
                .catch(function(err) {
                    res.status(500).json(err)
                });
        }
    }
}


module.exports = {
    getDetalleEgreso: getDetalleEgreso,
    getDetalles: getDetalles,
    validarDetalle: validarDetalle,
    getTotalEgresos: getTotalEgresos,
    getEgresosPaginacion: getEgresosPaginacion,
    crudEgreso: crudEgreso,
    crudDetalle: crudDetalle,
    crudDetalle2: crudDetalle2,
    getStock: getStock

};