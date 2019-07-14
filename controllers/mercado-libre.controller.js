'use strict'
var db = require('./../bdd.coneccion');
//mercado libre
var meli = require('../mercado-libre/index.js');
var config = require("../mercado-libre/config.js");
// var meliObject = new meli.Meli();
// var tokens = require("../mercado-libre/tokens.js");
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
                    // si existe ya la publicacion en mercado libre, obetener el token para actualizarlo el stock en mec
                db.any('SELECT * FROM config where id=1')
                    .then((data) => {
                        if (data.length > 0 && data[0].token) {                   
                            let meliObject = new meli.Meli(data[0].token, data[0].refresh_token);
                            
                            //cuando el stock se a terminado se tiene que dar de baja la publicacion en mec y en la bdd
                            if(body.stock <= 0 ){ 
                                let body2={ //consultar la documentacion de mec de los estados de las publicaciones
                                        "status":"closed"
                                }
                                meliObject.put("items/" + publicacion.idplataforma, body2, (err, resp) => {
                                    if (err) {
                                        console.log(err);
                                        res.status(400).json(err)
                                    } else {
                                        //una vez dado de baja en mec, dar de baja la publicacion en la bdd local
                                        db.any('UPDATE publicacion SET estado=0 where idpublicacion=$1',publicacion.idpublicacion)
                                            .then(function(data){
                                                 res.status(200).json({
                                                'idproducto': body.idproducto
                                                })
                                            }).catch(function(err) {
                                                console.log(err);
                                                res.status(400).json({
                                                    result: 'ERROR AL DAR DE BAJA PUBLICACIÓN CON STOCK 0 EN LA BDD',
                                                    message: err
                                                })
                                            });
                                    }
                                })               

                            }else{
                                let body2 = {
                                    "available_quantity": body.stock
                                }
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

                            }
                     
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
            console.log("token actual:"+data[0].token);
            meliObject.refreshAccessToken((err, body) => {
                if (err) {
                    console.log("error al refrescar token de mec:" + err);
                } else if (body) {
                    // console.log(body);
                    db.any('UPDATE config SET refresh_token=$1, token=$2 where id=1', [body.refresh_token, body.access_token])
                        .then(function() {
                            console.log("actualizado nuevo token, nuevo token:" + body.access_token);
                        })
                        .catch(function(err) {
                            console.log("error al actualizar nuevo token");
                        })
                }
            })

        })
}

//MODULO PARA CONVERTIR FUNCIONES ASINCRONAS CON CALLBACK EN PROMISES, ESTA FUNCION SE EJECUTA TODOS LOS DIAS A LA 1 DE LA MAÑANA
const util=require("util");

async function  actualizarPublicacionesVencidas() { //TODA ESTA FUNCION SE EJECUTA SINCRONICAMENTE, TODOS LOS DIAS A LA 1:00 AM MEDIANTE UNA TAREA CON EN CRON
    let now = new Date();
    try {
        /*PRIMERO OBTIENES TODAS LAS PUBLICAIONES VENCIDAS, MERCADO LIBRE (MEC) SOLO TIENE ACTIVAS LAS PUBLICAIONES POR 60 DIAS, UNA VEZ 
        TERMINADO ESE TIEMPO SE DEBE REPUBLICAR ESE PRODUCTO, MERCADO LIBRE OTORGA UN NUEVO ID A ESA PUBLICACION Y HAY QUE GUARDARLA EN LA BDD
        */
        const publicacionesVencidas = await db.any('select _stock, p.costo _costo ,pu.idpublicacion,pu.estado,pu.idproducto,pu.idplataforma from producto_stock p  join publicacion pu on p.idproducto=pu.idproducto  where pu.fechavencimiento<$1 and pu.estado=1 and _stock > 0', now)
        // console.log(publicacionesVencidas);
        const token= await  db.any('SELECT * FROM config where id=1');
        // console.log(token);
        let meliObject = new meli.Meli(token[0].token, token[0].refresh_token);
        const POSTMEC=util.promisify(meliObject.post) //CONVERSION DE LA FUNCION POST DEL SDK DE MEC A UNA PROMISE LO QUE PERMITE UTILIZAR LA NOTACION ASYNC/AWAIT

        if(publicacionesVencidas.length > 0){

            for (var i in publicacionesVencidas) {
                //SE DEBE ENVIAR ESTO EN EL BODY (ESTO EXIJE MEC), CON EL PRECIO, STOCK Y PLAN
                let nueva_publicacion = {
                    "price": parseFloat(publicacionesVencidas[i]._costo),
                    "quantity": publicacionesVencidas[i]._stock,
                    "listing_type_id": "free"
                }
                //EN ESTA VARIABLE SE GUARDA EL BODY QUE DEVUELVE MEC CUANDO SE EJECUTA LA TRANSACCION CON ELLOS
                let body = await POSTMEC(`items/${publicacionesVencidas[i].idplataforma}/relist`, nueva_publicacion);
                //UNA VEZ REPUBLICADO EN MEC SE DEBE CREAR UNA NUEVA PUBLICAION EN LA BDD CON LA INFORMACION QUE NOS VIENE DE MEC
                let SQL = 'select * from  fun_ime_publicacion($1,$2,$3,$4,$5,$6,$7);';
                await db.any(SQL,[0,publicacionesVencidas[i].idproducto,1,body.site_id, body.id,body.end_time,1]);
                // UNA VEZ CREADA LA NUEVA PUBLICAION SE DEBE ACTUALIZAR EL ESTADO DE LA PUBLICAION VENCIDA A CERO, QUE SIGNIFICA CERRADA Y YA NO SE LA TOMA ENCUENTA.
                let viejaPublicacion= await db.any('UPDATE publicacion SET estado=0 where idpublicacion=$1',publicacionesVencidas[i].idpublicacion);
                console.log(viejaPublicacion,"ACTUALIZADO LA PUBLICACION VENCIDA A ESTADO CERO");
                
            };
        }else{
            console.log("SIN PUBLICACIONES VENCIDAS")
        }


    } catch (error) {
        console.log("error");
        console.log(error);
    }
    
}





module.exports = {
    respuestaMec: respuestaMec,
    redireccionamientoaMec: redireccionamientoaMec,
    publicarProducto: publicarProducto,
    notificaciones: notificaciones,
    actualizarStock: actualizarStock,
    actualizarTokenMec: actualizarTokenMec,
    actualizarPublicacionesVencidas: actualizarPublicacionesVencidas
};