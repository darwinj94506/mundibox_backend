'use strict'
var db=require('./../bdd.coneccion');
//mercado libre
var meli = require('../mercado-libre/index.js');
var config = require("../mercado-libre/config.js");
// var meliObject = new meli.Meli();
var tokens = require("../mercado-libre/tokens.js");
var redirec_uri=config.config.redirect_uri;

   //esta funcion y ruta se ejcutan cuando solicito un token y mercado libre me lo envia a esta ruta 
  function respuestaMec(request, response, next) {
    var code= request.query.code;
    let meliObject = new meli.Meli();
    meliObject.authorize(code,redirec_uri,(err,body)=>{
      if(err){
        console.log(err)
        response.status(400).json("errorLogin")
      }else{
        
        //guardamos en la bdd local los tokens que nos develve mec en el body de la respuesta
        db.any('UPDATE config SET refresh_token=$1, token=$2 where id=1', [body.refresh_token,body.access_token])
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
  var code= request.body;
  console.log("-------------------------------------esta notificacion llega de mercado libre----------------------------");
  console.log(code);
  response.render('index', { title: code.topic});
}
//se la llama cuando aun no se ha auntenticando en mec
function redireccionamientoaMec(request, response, next) {
  var redirecturi= meliObject.getAuthURL(redirec_uri);
  console.log(redirecturi);
  response.status(301).redirect(redirecturi); 
}
  
function publicarProducto(req,res,next){
  let body=req.body;
  //optenemos en token de la bdd 
  db.any('SELECT * FROM config where id=1')
    .then(function(data) {
      //cuando existe token
      if(data.length>0 && data[0].token){
        //creamos un objeto del sdk de mercado libre con los tokens obtenidos
        let meliObject = new meli.Meli(data[0].token,data[0].refresh_token);
        db.any('SELECT * FROM publicacion where idproducto=$1 and estado=1',[body.idproducto])
          .then((data)=> {           
            if(data.length>0){ // si existe ya la publicacion
              let publicacion=data[0];
              let body2={ //atributo solicitado por mec en el que se indica el nuevo stock a publicar
                  "available_quantity":body.item.available_quantity
              }
              //actualiza el stock en mercado libre
              meliObject.put("items/"+publicacion.idplataforma,body2,(err,resp)=>{
                  if(err){
                      console.log(err);
                      res.status(400).json({
                        result:'ERROR_MEC',
                        message:err.message
                      })
                                 
                  }else{ 
                        //una vez actualizado en mec indicamos que ese item ha sido subido a mec en la tabla importacion_producto 
                        db.any('UPDATE importacion_producto ip SET mec=1 where ip.idproducto=$1', [body.idproducto])
                        .then(function() {
                            res.status(200).json({
                              titulo:body.item.title,
                              id:body.idproducto                          
                            })
                        })
                        .catch(function(err) {
                            console.log(err);
                            res.status(400).json({
                                result: 'ERROR',
                                message: 'Error al actualizar la propiedad mec de importacion_producto'
                            })
                        })                    
                  }
              })
            }else{ 
              console.log(body.item);
              //cuando es la primera vez que se va a subir ese producto
              meliObject.post("items",body.item,(err,resp)=>{
                  if(err){
                      res.status(400).json({
                        result:'ERROR_MEC',
                        message:err.message
                      }); 
                                  
                  }else{
                    if(resp.body){
                      //si se publica correctamenete el producto
                          //***********Creamos la publicacion en la bdd local con los datos que nos devulve mec ***************
                        var SQL = 'select * from  fun_ime_publicacion($1,$2,$3,$4,$5,$6,$7);';
                        db.any(SQL,[
                          0,
                          body.idproducto,
                          1,
                          resp.site_id, 
                          resp.id,
                          resp.end_time,
                          1
                        ])
                        .then(function(data){
                        // una vez creada la publicacion en la bbd actualizar la tabla importacion_producto para indicar que ese item ha sido publicado
                          db.any('UPDATE importacion_producto ip SET mec=1 where ip.idproducto=$1', [body.idproducto])
                            .then(function() {
                                res.status(200).json({
                                  titulo:body.item.title,
                                  id:body.idproducto
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
                        .catch(function (err) {
                          console.log(err);
                          res.status(400).json({
                            result:'error',
                            message:err[0]
                          })
                        });
                    }else{ //cuando envia error mercado libre
                      console.log(resp);
                          res.status(400).json({
                            result:'ERROR_MEC',
                            message:resp.message
                          })
                    }
                   
                  }
                })
            }
          }).catch(function (err) {
              console.log(err);
              res.status(400).json({
                  result:'ERROR AL BUSCAR PUBLICACIONES',
                  message:err[0]
              })
          });
      }else{
        let meliObject2 = new meli.Meli()
        let redirecturi= meliObject2.getAuthURL(redirec_uri);
        //si aun no tiene token se le envia a angular la url de redireccion para que redirija a la pagina de logueo de mec
        meliObject2.getAuthURL(redirec_uri);
        console.log(redirecturi);
        res.status(400).json({
          result:"TOKEN_REQUERIDO",
          message:redirecturi
        }); 
      }
    })
    .catch(function(err) {
      res.status(400).json({
        result:'ERROR AL OBTENER EL TOKEN DE LA BDD',
        message:err[0]
      })
      console.log(err);
      console.log("error al obtener el token");
    })  
}

  //*********************************************************************************
  /*actualiza el stock de un producto en mercado libre cuando se ha sacado un producto de inventario (facturado), solo si antes ese producto ya ha sido
  publicado en mercado libre, esto se hace para mantener sincronizado el stock del inventario con el de mercado ilbre*/
  function actualizarStock(req,res,next){
    var body=req.body;
      //primero comprobar que el producto no este ya publicado en mec y si esta solo hay que actualizar el stock 
      db.any('SELECT * FROM publicacion where idproducto=$1 and estado=1',[body.idproducto])
      .then(function (data) {         
        if(data.length>0){
          let publicacion=data[0];
          let body2={
              "available_quantity":body.stock
          }
           // si existe ya la publicacion en mercado libre
           db.any('SELECT * FROM config where id=1')
            .then((data)=> {
              if(data.length>0 && data[0].token){
                let meliObject = new meli.Meli(data[0].token,data[0].refresh_token);
                //actualiza el stock en mercado libre
                meliObject.put("items/"+publicacion.idplataforma,body2,(err,resp)=>{
                if(err){
                    console.log(err);
                    res.status(400).json(err)
                }else{ 
                      res.status(200).json({
                        'idproducto':body.idproducto                      
                      })
                    }
                })
              }else{
                let redirecturi= meliObject.getAuthURL(redirec_uri);
                console.log(redirecturi);
                res.status(400).json({
                  result:"TOKEN_REQUERIDO",
                  message:redirecturi
                }); 
            }
            }).catch(function(err) {
              res.status(400).json({
                result:'ERROR AL OBTENER EL TOKEN DE LA BDD',
                message:err[0]
              })
              console.log("error al obtener el token");
            }) 
        }else{
          res.status(200).json({
            result:'Advertencia',
            message:'Stock no actualizado, este producto no esta publicado en mercado libre'
          })
          
        }
      }).catch(function (err) {
          console.log(err);
          res.status(400).json({
              result:'ERROR AL BUSCAR PUBLICACIONES',
              message:err
          })
      });   
  }
  /*********************************************************************************
  función que permite actualizar el token de acceso a mercado libre, se ejecuta cada 
  5 horas 
  */
  function actualizarTokenMec(){
    console.log("actualizando el token:"+tokens.tokens.refresh_token);
    meliObject.refreshAccessToken(tokens.tokens.refresh_token,(err,body)=>{
      if(err){
        console.log("error al refrescar token de mec:"+err);
      }else if(body){
        console.log(body);
        tokens.tokens.token=body.access_token;
        tokens.tokens.refresh_token=body.refresh_token;
        db.any('UPDATE config SET refresh_token=$1, token=$2 where id=1', [body.refresh_token,body.access_token])
        .then(function() {
          console.log("actualizado nuevo token");   
        })
        .catch(function(err) {
          console.log("error al actualizar nuevo token");
        })             
      }
    }) 
  }

  function guardarToken(refresh_token,access_token){
    db.any('UPDATE config SET refresh_token=$1, token=$2 where id=1', [refresh_token,access_token])
    .then(function() {
      console.log("token guardado");
    })
    .catch(function(err) {
      console.log("error al guardar nuevo token");
    })  
  }

  //en la bbdd siempre debe existir en la tabla config un registro con id 1
  function getToken(){
    db.any('SELECT * FROM config where id=1')
    .then(function(data) {
      //cuando existe token
      if(data.length>0){

      }else{

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

  function actualizarPublicacionesVencidas(){
    let now=new Date();
    console.log("fecha actual:"+now);
    // busca los registros vencidos en la bdd, cada registro se crea siempre que crea una nueva publicacion en mec
    db.any('select _stock, p.costo _costo, pu.idpublicacion,pu.estado,pu.idproducto,pu.idplataforma from producto_stock p  join publicacion pu on p.idproducto=pu.idproducto  where pu.fechavencimiento>$1 and pu.estado=1',now)
    .then(function(data) {
      console.log(data);
      if(data.length>0){
        data.forEach(pub=>{
          //por cada registro que este vencido se crea un json para republicarlo en mec
          let publicacion={
            "price": pub._costo,
            "quantity": pub._stock,
            "listing_type_id": "free"
          }
          console.log(publicacion);
          //hacer una re-publicacion en mec
          meliObject.post("items",body.item,(err,resp)=>{
            if(err){
                console.log(err);
                res.status(400).json({
                  result: 'ERROR_MEC',
                  message: err.message
              })
            }else{
              //si se publica correctamenete el producto
                console.log(resp);   
                  //***********Creamos la publicacion en la bdd local con los datos que nos devulve mec ***************
                var SQL = 'select * from  fun_ime_publicacion($1,$2,$3,$4,$5,$6,$7);';
                db.any(SQL,[
                  0,
                  body.idproducto,
                  1,
                  resp.site_id, 
                  resp.id,
                  resp.end_time,
                  1
                ])
                .then(function(data){
                // una vez creada la publicacion en la bbd actualizar la tabla importacion_producto para indicar que ese item ha sido publicado
                  db.any('UPDATE importacion_producto ip SET mec=1 where ip.idproducto=$1', [body.idproducto])
                    .then(function() {
                        res.status(200).json({
                          titulo:body.item.title,
                          id:body.idproducto
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
                .catch(function (err) {
                  console.log(err);
                  res.status(400).json({
                    result:'Error',
                    message:err[0]
                  })
                });
            }
          })
        })
      }
    })
    .catch(function(err) {
      console.log("error en la consulta!!");
      console.log(err);
    })
  }
  
module.exports = {
    respuestaMec:respuestaMec,
    redireccionamientoaMec:redireccionamientoaMec,
    publicarProducto:publicarProducto,
    notificaciones:notificaciones,
    actualizarStock:actualizarStock,
    actualizarTokenMec:actualizarTokenMec,
    getToken:getToken,
    actualizarPublicacionesVencidas:actualizarPublicacionesVencidas
};
