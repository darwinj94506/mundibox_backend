'use strict'
var db=require('./../bdd.coneccion');
//mercado libre
var meli = require('../mercado-libre/index.js');
var config = require("../mercado-libre/config.js");
var meliObject = new meli.Meli();
var tokens = require("../mercado-libre/tokens.js");


var redirec_uri=config.config.redirect_uri;

  function respuestaMec(request, response, next) {
     
      var code= request.query.code;

      meliObject.authorize(code,redirec_uri,(err,body)=>{
          if(err){
              console.log(err)

          }else{
              console.log(body);
              tokens.tokens.token=body.token;
              tokens.tokens.refresh_token=body.refresh_token;  
          }
      })

      //solicitar el token
            


    // meliObject.get('sites/' + config.config.site_id +'/categories', function (err, res) {
    //     console.log("estoy logueaado !!!!!!!!!");
    //     if(res){
    //         response.status(200)
    //         .json({
    //               status: 'llego a mercado libre',
    //               data: res,
    //               message: 'transacción exitosa'
    //         })

    //     }else{
    //         console.log("error!!!!!!!!!!!!"+err);
    //         response.status(400)
    //         .json(err)
    //     }
    // });
}

    function redireccionamientoaMec(request, response, next) {
        var redirecturi= meliObject.getAuthURL(redirec_uri);
        console.log(redirecturi);
        response.status(301).redirect(redirecturi); 
  }

  
  

  


module.exports = {
    respuestaMec:respuestaMec,
    redireccionamientoaMec:redireccionamientoaMec
};
