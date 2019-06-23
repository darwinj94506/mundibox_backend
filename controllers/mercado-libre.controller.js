'use strict'
var db=require('./../bdd.coneccion');
//mercado libre
var meli = require('../mercado-libre/index.js');
var config = require("../mercado-libre/config.js");
var meliObject = new meli.Meli();
var tokens = require("../mercado-libre/tokens.js");
var redirec_uri=config.config.redirect_uri;
   //esta funcion y ruta se ejcutan cuando solicito un token y mercado libre me lo envia a esta ruta 
  function respuestaMec(request, response, next) {
      var code= request.query.code;

      meliObject.authorize(code,redirec_uri,(err,body)=>{
          if(err){
              console.log(err)
              response.status(400).json("errorLogin")
          }else{
              console.log(body);
              tokens.tokens.token=body.access_token;
              tokens.tokens.refresh_token=body.refresh_token;
              response.render('index', { title: 'Permisos otorgados de mercado libre!' });
            //   response.status(200).json("logueadoExito");  
          }
      })
}

function notificaciones(request, response, next) {
  var code= request.body;
  console.log("-------------------------------------esta notificacion llega de mercado libre----------------------------");
  console.log(code);
  response.render('index', { title: code.topic});

  
}

    function redireccionamientoaMec(request, response, next) {
        var redirecturi= meliObject.getAuthURL(redirec_uri);
        console.log(redirecturi);
        response.status(301).redirect(redirecturi); 
  }
  
  function publicarProducto(req,res,next){
    var token= tokens.tokens.token;
    var body=req.body;
    console.log(body);
      if(token){  
        //primero comprobar que el producto no este ya publicado en mec y si esta solo hay que actualizar el stock 
        db.any('SELECT * FROM publicacion where idproducto=$1 and estado=1',[body.idproducto])
        .then(function (data) {
            
            var publicacion=data[0];
            var body2={
                "available_quantity":body.item.available_quantity
            }
          if(data.length>0){ // si existe ya la publicacion
            //actualiza el stock en mercado libre
            meliObject.put("items/"+publicacion.idplataforma,body2,(err,resp)=>{
                if(err){
                    console.log(err);
                    res.status(400).json({
                      result:'ERROR_MEC',
                      message:err.message
                    })
                }else{ 
                      //indicamos que ese item ha sido subido a mec en la tabla importacion_producto 
                      db.any('UPDATE importacion_producto SET mec=1 ip where ip.idimportacionproducto=$1', [body.idimportacionproducto])
                      .then(function() {
                          res.status(200).json({
                            titulo:body.item.title,
                            id:body.idproducto                          
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
            })
          }else{
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
                      1,
                      resp.site_id, 
                      resp.id,
                      resp.end_time,
                      body.idproducto, 
                      1
                    ])
                    .then(function(data){
                      //indicamos que ese item ha sido subido a mec en la tabla importacion_producto 
                        db.any('UPDATE importacion_producto SET mec=1 ip where ip.idimportacionproducto=$1', [body.idimportacionproducto])
                        .then(function() {
                            res.status(200).json({
                              titulo:body.item.title,
                              id:body.idproducto
                            })
                        })
                        .catch(function(err) {
                            // console.log(err);
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
                    // ************************************************************************************ 
                //  res.status(200).json(resp)
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
          var redirecturi= meliObject.getAuthURL(redirec_uri);
          console.log(redirecturi);
          res.status(400).json({
            result:"TOKEN_REQUERIDO",
            message:redirecturi
          }); 
      }
  }

  //*********************************************************************************
  /*actualiza el stock de un producto en mercado libre cuando se ha sacado un producto (facturado), solo si antes ese producto ya ha sido
  publicado en mercado libre, esto se hace para mantener sincronizado el stock de mi inventario con el de mercado ilbre*/
  function actualizarStock(req,res,next){
    var token= tokens.tokens.token;
    var body=req.body;
    console.log(body);
     
    //primero comprobar que el producto no este ya publicado en mec y si esta solo hay que actualizar el stock 
    db.any('SELECT * FROM publicacion where idproducto=$1 and estado=1',[body.idproducto])
    .then(function (data) {
        var publicacion=data[0];
        var body2={
            "available_quantity":body.stock
        }
      if(data.length>0){ // si existe ya la publicacion en mercado libre
        if(token){
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
        } else{
          var redirecturi= meliObject.getAuthURL(redirec_uri);
          console.log(redirecturi);
          res.status(400).json({
            result:"TOKEN_REQUERIDO",
            message:redirecturi
          }); 
      }
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
    meliObject.refreshAccessToken()
    var token;
    var refresh_token;
    db.any('UPDATE config SET token=$1, refresh_token=$2', [token,refresh_token])
    .then(function() {
      console.log("actualizado nuevo token");
    })
    .catch(function(err) {
      console.log("error al actualizar nuevo token");
    })             
  }
  
module.exports = {
    respuestaMec:respuestaMec,
    redireccionamientoaMec:redireccionamientoaMec,
    publicarProducto:publicarProducto,
    notificaciones:notificaciones,
    actualizarStock:actualizarStock,
    actualizarTokenMec:actualizarTokenMec
};

  //***********Creamos la publicacion en la bdd local con los datos que nos devulve mec ***************
  // var SQL = 'select * from  fun_ime_publicacion($1,$2,$3,$4,$5,$6,$7);';
  // db.any(SQL,[
  //   0,
  //   1,
  //   resp.site_id, 
  //   resp.id,
  //   resp.end_time,
  //   body.idproducto, 
  //   1
  // ])
  // .then(function(data){
  //   res.status(200)
  //   .json(data[0]);
  // })
  // .catch(function (err) {
  //   console.log(err);
  //   res.status(400).json(err[0])
  // });
   //************************************************************************************ 