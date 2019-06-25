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
        //guardamos en la bdd local los tokens
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
  var token= tokens.tokens.token;
  var body=req.body;
  console.log("tokeeeeeeeeeeeeeeeeeeeeeeeeeeee:"+token);
  console.log(body);
  if(token){  
    //primero comprobar que el producto no este ya publicado en mec y si esta solo hay que actualizar el stock 
    db.any('SELECT * FROM publicacion where idproducto=$1 and estado=1',[body.idproducto])
    .then(function (data) {
        var publicacion=data[0];
        var body2={
            "available_quantity":body.item.available_quantity
        }
        console.log("publicaiones existenetes:"+data.length);

      if(data.length>0){ // si existe ya la publicacion
        //actualiza el stock en mercado libre
        meliObject.put("items/"+publicacion.idplataforma,body2,(err,resp)=>{
            if(err){
              if(err.message==="access_token.invalid"){
                console.log("error de tokennnnnnnnnnnnnnnnnn");
                //si el token de mec es invalido se envia la url que nos redirija a la pagna de login de mec
                var redirecturi= meliObject.getAuthURL(redirec_uri);
                console.log(redirecturi);
                res.status(400).json({
                  result:"TOKEN_REQUERIDO",
                  message:redirecturi
                }); 
              }else{
                console.log(err);
                res.status(400).json({
                  result:'ERROR_MEC',
                  message:err.message
                })
              }               
            }else{ 
                console.log(body.idimportacionproducto);
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
        console.log("Entre soy el primero");
        //cuando es la primera vez que se va a subir ese producto
        meliObject.post("items",body.item,(err,resp)=>{
            if(err){
              console.log("SOY EL PRIMER ERROR"+err);
              if(err.message=="access_token.invalid"){
                console.log("error de tokennnnnnnnnnnnnnnnnn");
                //si el token de mec es invalido se envia la url que nos redirija a la pagna de login de mec
                var redirecturi= meliObject.getAuthURL(redirec_uri);
                console.log(redirecturi);
                res.status(400).json({
                  result:"TOKEN_REQUERIDO",
                  message:redirecturi
                }); 
              }else{
                console.log("soy el segundo error");
                console.log(err);
                res.status(400).json({
                  result:'ERROR_MEC',
                  message:err.message
                })
              }               
            }else{
              console.log()
              console.log("no hubo error");
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
      }
    }).catch(function (err) {
        console.log(err);
        res.status(400).json({
            result:'ERROR AL BUSCAR PUBLICACIONES',
            message:err[0]
        })
    });
  }else{
    //si aun no tiene token se le envia a angular la url de redireccion para que redirija a la pagina de logueo de mec
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

  function getToken(){
    db.any('SELECT * FROM config where id=1')
    .then(function(data) {
      console.log(data);
      console.log(data[0].token);
      tokens.tokens.token=data[0].token;
      tokens.tokens.refresh_token=data[0].refresh_token;
    })
    .catch(function(err) {
      console.log("error al guardar nuevo token");
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
