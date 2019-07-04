'use strict'
var db = require('./../bdd.coneccion');
//mercado libre
var meli = require('../mercado-libre/index.js');
var config = require("../mercado-libre/config.js");
// var meliObject = new meli.Meli();
var tokens = require("../mercado-libre/tokens.js");
var redirec_uri = config.config.redirect_uri;

//esta funcion y ruta se ejcutan cuando solicito un token y mercado libre me lo envia a esta ruta 
function respuestaMec(request, response, next) {
    console.log("respondio mec");
    var code = request.query.code;
    let meliObject = new meli.Meli();
    meliObject.authorize(code, redirec_uri, (err, body) => {
        if (err) {
            console.log(err)
            response.status(400).json("errorLogin")
        } else {

            //guardamos en la bdd local los tokens que nos develve mec en el body de la respuesta
            db.any('UPDATE config SET refresh_token=$1, token=$2 where id=1', [body.refresh_token, body.access_token])
                .then(function() {
                    response.render('index', { title: 'Permisos otorgados de mercado libre!' });
                    console.log("token guardado");
                })
                .catch(function(err) {
                    console.log("error al guardar nuevo token");
                })
        }
    })
}

function notificaciones(request, response, next) {
    var code = request.body;
    console.log("-------------------------------------esta notificacion llega de mercado libre----------------------------");
    console.log(code);
    response.render('index', { title: code.topic });
}
//se la llama cuando aun no se ha auntenticando en mec
function redireccionamientoaMec(request, response, next) {
    var redirecturi = meliObject.getAuthURL(redirec_uri);
    console.log(redirecturi);
    response.status(301).redirect(redirecturi);
}

function publicarProducto(req, res, next) {
    let body = req.body;
    console.log(req.body);
    //optenemos en token de la bdd 
    db.any('SELECT * FROM config where id=1')
        .then(function(data) {
            //cuando existe token
            if (data.length > 0 && data[0].token) {
                //creamos un objeto del sdk de mercado libre con los tokens obtenidos
                let meliObject = new meli.Meli(data[0].token, data[0].refresh_token);
                db.any('SELECT * FROM publicacion where idproducto=$1 and estado=1', [body.idproducto])
                    .then((data) => {
                        if (data.length > 0) { // si existe ya la publicacion
                            let publicacion = data[0];
                            let body2 = { //atributo solicitado por mec en el que se indica el nuevo stock a publicar
                                    "available_quantity": body.item.available_quantity
                                }
                                //actualiza el stock en mercado libre
                            meliObject.put("items/" + publicacion.idplataforma, body2, (err, resp) => {
                                // console.log(resp);
                                // console.log(err);
                                if (err) {
                                    res.status(400).json({
                                        result: 'ERROR_MEC',
                                        message: err.message,
                                        titulo: body.item.title,
                                        id: body.idproducto
                                    });
                                } else {
                                    if (resp.error) {
                                        if (resp.message == "invalid_token" || resp.message == "expired_token") {
                                            let meliObject2 = new meli.Meli()
                                            let redirecturi = meliObject2.getAuthURL(redirec_uri);
                                            //si el token es incorrecto debe loguearse nuevamente
                                            meliObject2.getAuthURL(redirec_uri);
                                            console.log(redirecturi);
                                            res.status(400).json({
                                                result: "TOKEN_REQUERIDO",
                                                message: redirecturi
                                            });
                                        } else {
                                            res.status(400).json({
                                                result: 'ERROR_MEC',
                                                message: resp.message,
                                                titulo: body.item.title,
                                                id: body.idproducto
                                            })
                                        }
                                    } else {
                                        //una vez actualizado el stok en mec actualiza el campo de la tabla importacion producto para indicar que ha sido publicado                                    
                                        db.any('UPDATE importacion_producto ip SET mec=1 where ip.idproducto=$1', [body.idproducto])
                                            .then(function() {
                                                res.status(200).json({
                                                    titulo: body.item.title,
                                                    id: body.idproducto
                                                })
                                            })
                                            .catch(function(err) {
                                                // console.log(err);
                                                res.status(400).json({
                                                    result: 'ERROR',
                                                    message: 'Error al actualizar la propiedad mec de importacion_producto'
                                                })
                                            })
                                    }


                                }
                            })
                        } else {
                            // console.log(body.item);
                            //cuando es la primera vez que se va a subir ese producto
                            meliObject.post("items", body.item, (err, resp) => {
                                if (err) {
                                    res.status(400).json({
                                        result: 'ERROR_MEC',
                                        message: err.message,
                                        titulo: body.item.title,
                                        id: body.idproducto
                                    });

                                } else {
                                    console.log(resp);
                                    if (resp.error) {
                                        if (resp.message == "invalid_token" || resp.message == "expired_token") {
                                            let meliObject2 = new meli.Meli()
                                            let redirecturi = meliObject2.getAuthURL(redirec_uri);
                                            //si el token es incorrecto debe loguearse nuevamente
                                            meliObject2.getAuthURL(redirec_uri);
                                            console.log(redirecturi);
                                            res.status(400).json({
                                                result: "TOKEN_REQUERIDO",
                                                message: redirecturi
                                            });
                                        } else {
                                            res.status(400).json({
                                                result: 'ERROR_MEC',
                                                message: resp.message,
                                                titulo: body.item.title,
                                                id: body.idproducto
                                            })
                                        }
                                    } else {

                                        //si se publica correctamenete el producto
                                        //***********Creamos la publicacion en la bdd local con los datos que nos devulve mec ***************
                                        var SQL = 'select * from  fun_ime_publicacion($1,$2,$3,$4,$5,$6,$7);';
                                        db.any(SQL, [
                                                0,
                                                body.idproducto,
                                                1,
                                                resp.site_id,
                                                resp.id,
                                                resp.end_time,
                                                1
                                            ])
                                            .then(function(data) {
                                                // una vez creada la publicacion en la bbd actualizar la tabla importacion_producto para indicar que ese item ha sido publicado
                                                db.any('UPDATE importacion_producto ip SET mec=1 where ip.idproducto=$1 and ip.idimportacionproducto=$2', [body.idproducto, body.idimportacionproducto])
                                                    .then(function() {
                                                        res.status(200).json({
                                                            titulo: body.item.title,
                                                            id: body.idproducto
                                                        })
                                                    })
                                                    .catch(function(err) {
                                                        console.log(err);
                                                        res.status(400).json({
                                                            result: 'ERROR',
                                                            message: 'Error al actualizar la propiedad mec de la tabla importacion_producto'
                                                        })
                                                    })
                                            })
                                            .catch(function(err) {
                                                console.log(err);
                                                res.status(400).json({
                                                    result: 'error',
                                                    titulo: body.item.title,
                                                    message: err[0]
                                                })
                                            });
                                    }
                                }
                            })
                        }
                    }).catch(function(err) {
                        console.log(err);
                        res.status(400).json({
                            result: 'ERROR AL BUSCAR PUBLICACIONES',
                            titulo: body.item.title,
                            message: err[0]
                        })
                    });
            } else {
                let meliObject2 = new meli.Meli()
                let redirecturi = meliObject2.getAuthURL(redirec_uri);
                //si aun no tiene token se le envia a angular la url de redireccion para que redirija a la pagina de logueo de mec
                meliObject2.getAuthURL(redirec_uri);
                console.log(redirecturi);
                res.status(400).json({
                    result: "TOKEN_REQUERIDO",
                    message: redirecturi
                });
            }
        })
        .catch(function(err) {
            res.status(400).json({
                result: 'ERROR AL OBTENER EL TOKEN DE LA BDD',
                message: err[0],
                titulo: body.item.title
            })
            console.log(err);
            console.log("error al obtener el token");
        })
}

//*********************************************************************************
/*actualiza el stock de un producto en mercado libre cuando se ha sacado un producto de inventario (facturado), solo si antes ese producto ya ha sido
publicado en mercado libre, esto se hace para mantener sincronizado el stock del inventario con el de mercado ilbre*/
function actualizarStock(req, res, next) {
    var body = req.body;
    //primero comprobar que el producto no este ya publicado en mec y si esta solo hay que actualizar el stock 
    db.any('SELECT * FROM publicacion where idproducto=$1 and estado=1', [body.idproducto])
        .then(function(data) {
            if (data.length > 0) {
                let publicacion = data[0];
                let body2 = {
                        "available_quantity": body.stock
                    }
                    // si existe ya la publicacion en mercado libre, obetener el token para actualizarlo el stock en mec
                db.any('SELECT * FROM config where id=1')
                    .then((data) => {
                        if (data.length > 0 && data[0].token) {
                            let meliObject = new meli.Meli(data[0].token, data[0].refresh_token);
                            //actualiza el stock en mercado libre
                            meliObject.put("items/" + publicacion.idplataforma, body2, (err, resp) => {
                                if (err) {
                                    console.log(err);
                                    res.status(400).json(err)
                                } else {
                                    res.status(200).json({
                                        'idproducto': body.idproducto
                                    })
                                }
                            })
                        } else {
                            let redirecturi = meliObject.getAuthURL(redirec_uri);
                            console.log(redirecturi);
                            res.status(400).json({
                                result: "TOKEN_REQUERIDO",
                                message: redirecturi
                            });
                        }
                    }).catch(function(err) {
                        res.status(400).json({
                            result: 'ERROR AL OBTENER EL TOKEN DE LA BDD',
                            message: err[0]
                        })
                        console.log("error al obtener el token");
                    })
            } else {
                res.status(200).json({
                    result: 'Advertencia',
                    message: 'Stock no actualizado, este producto no esta publicado en mercado libre'
                })

            }
        }).catch(function(err) {
            console.log(err);
            res.status(400).json({
                result: 'ERROR AL BUSCAR PUBLICACIONES',
                message: err
            })
        });
}
/*********************************************************************************
función que permite actualizar el token de acceso a mercado libre, se ejecuta cada 
5 horas 
*/
function actualizarTokenMec() {
    //obtener el token almacenado en la bdd
    db.any('SELECT * FROM config where id=1')
        .then((data) => {
            let meliObject = new meli.Meli(data[0].token, data[0].refresh_token);
            // console.log("actualizando el token:"+tokens.tokens.refresh_token);
            meliObject.refreshAccessToken((err, body) => {
                if (err) {
                    console.log("error al refrescar token de mec:" + err);
                } else if (body) {
                    console.log(body);
                    // tokens.tokens.token=body.access_token;
                    // tokens.tokens.refresh_token=body.refresh_token;
                    db.any('UPDATE config SET refresh_token=$1, token=$2 where id=1', [body.refresh_token, body.access_token])
                        .then(function() {
                            console.log("actualizado nuevo token, nuevo access token:" + body.access_token);
                        })
                        .catch(function(err) {
                            console.log("error al actualizar nuevo token");
                        })
                }
            })

        })


}

function guardarToken(refresh_token, access_token) {
    db.any('UPDATE config SET refresh_token=$1, token=$2 where id=1', [refresh_token, access_token])
        .then(function() {
            console.log("token guardado");
        })
        .catch(function(err) {
            console.log("error al guardar nuevo token");
        })
}

//en la bbdd siempre debe existir en la tabla config un registro con id 1
function getToken() {
    db.any('SELECT * FROM config where id=1')
        .then(function(data) {
            //cuando existe token
            if (data.length > 0) {

            } else {

            }
            console.log(data);
            // console.log(data[0].token);
            // tokens.tokens.token=data[0].token;
            // tokens.tokens.refresh_token=data[0].refresh_token;
        })
        .catch(function(err) {
            console.log("error al obtener el token");
        })
}

function actualizarPublicacionesVencidas() {
    let now = new Date();
    console.log("fecha actual:" + now);
    // busca los registros vencidos en la bdd, cada registro se crea siempre que crea una nueva publicacion en mec
    db.any('select _stock, p.costo _costo ,pu.idpublicacion,pu.estado,pu.idproducto,pu.idplataforma from producto_stock p  join publicacion pu on p.idproducto=pu.idproducto  where pu.fechavencimiento<$1 and pu.estado=1 and _stock > 0', now)
        .then(function(publicacionesVencidas) {
            console.log(publicacionesVencidas);
            if (publicacionesVencidas.length > 0) {
                var longitudPublicacionesVencidas = publicacionesVencidas.length;
                //si existen publicaciones, llamo al token
                db.any('SELECT * FROM config where id=1')
                    .then((token) => {
                        let meliObject = new meli.Meli(token[0].token, token[0].refresh_token);
                        var publicaciones_devueltas_mec = [];
                        for (var i in publicacionesVencidas) {
                            //por cada registro que este vencido se crea un json para republicarlo en mec
                            let nueva_publicacion = {
                                "price": parseFloat(publicacionesVencidas[i]._costo),
                                "quantity": publicacionesVencidas[i]._stock,
                                "listing_type_id": "free"
                            }

                            console.log(nueva_publicacion);
                            //hacer una re-publicacion en mec, idplataforma es el id con el que se guarda la publicacion en mec
                            meliObject.post(`items/${publicacionesVencidas[i].idplataforma}/relist`, nueva_publicacion, (err, resp) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    if (resp.error) {
                                        console.log("error al republicar");
                                        console.log(resp);
                                    } else { //si se re-publica correctamenete el producto (mercado libre crea una nueva publicacion)
                                        //***********almacena todas las republicaciones devueltas por mec***************
                                        let object = {
                                            "site_id": resp.site_id,
                                            "id": resp.id,
                                            "end_time": resp.end_time,
                                            "idpublicacion": publicacionesVencidas[i].idpublicacion,
                                            "idproducto": publicacionesVencidas[i].idproducto
                                        }
                                        publicaciones_devueltas_mec.push(object);
                                        if (longitudPublicacionesVencidas == i - 1) {
                                            //***** formacion de los items devueltos por mec para pasarlos a la funcion de la bdd
                                            var cuerpo = publicaciones_devueltas_mec;
                                            var lista = '';
                                            for (var j in cuerpo) {
                                                lista += 'select ' + cuerpo[j].site_id + '::character varying site_id,' + cuerpo[j].id + '::integer id,' + cuerpo[j].idpublicacion + '::integer idpublicacion,' + cuerpo[j].idproducto + '::integer idproducto' + cuerpo[j].end_time + '::date end_time';
                                                if (i == (cuerpo.length - 1)) {
                                                    lista += ';';
                                                } else {
                                                    lista += ' union ';
                                                }

                                                if (j == (cuerpo.length - 1)) {
                                                    console.log(lista);
                                                    db.any('select * from  fun_ime_republicacion($1, $2);', [lista, cuerpo.length])
                                                        .then(function(data) {
                                                            console.log(data)
                                                            console.log("republicado correctamente")
                                                        })
                                                        .catch(function(err) {
                                                            console.log("error al republicar");
                                                            console.log(err);
                                                        });
                                                }
                                            }
                                        }
                                    }

                                }
                            })
                        }
                    })
                    .catch(function(err) {
                        console.log("error al traer el token");
                        console.log(err);
                    })
            } else
                console.log("No existen publicaiones vencidas")
        })
        .catch(function(err) {
            console.log("error en la consulta de publicaciones vencidas");
            console.log(err);
        })
}

module.exports = {
    respuestaMec: respuestaMec,
    redireccionamientoaMec: redireccionamientoaMec,
    publicarProducto: publicarProducto,
    notificaciones: notificaciones,
    actualizarStock: actualizarStock,
    actualizarTokenMec: actualizarTokenMec,
    getToken: getToken,
    actualizarPublicacionesVencidas: actualizarPublicacionesVencidas
};