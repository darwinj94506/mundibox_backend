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
        //primero toca comprobar que el producto no este ya publicado en mec y si esta solo hay que actualizar el stock 
        db.any('SELECT * FROM publicacion where idproducto=$1 and estado=1',[body.idproducto])
        .then(function (data) {
            
            var publicacion=data[0];
            var body2={
                "available_quantity":body.item.available_quantity
            }
          if(data.length>0){ // si existe ya la publicacion

            meliObject.put("items/"+publicacion.idplataforma,body2,(err,resp)=>{
                if(err){
                    console.log(err);
                    res.status(400).json(err)
                }else{ 
                      console.log(resp);
                      res.status(200).json(resp);
                }
            })
          }else{
            meliObject.post("items",body.item,(err,resp)=>{
                if(err){
                    console.log(err);
                    res.status(400).json(resp)
                }else{
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
                      res.status(200)
                      .json(data[0]);
                    })
                    .catch(function (err) {
                      console.log(err);
                      res.status(400).json(err[0])
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
                message:err
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
  
module.exports = {
    respuestaMec:respuestaMec,
    redireccionamientoaMec:redireccionamientoaMec,
    publicarProducto:publicarProducto,
    notificaciones:notificaciones
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