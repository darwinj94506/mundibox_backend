'use strict'
var db=require('./../bdd.coneccion');
var bcrypt = require('bcrypt-nodejs');
var jwt=require('../services/jwt');


function findUsuarios(req, res) {
  const queryParams = req.body;
  const filter = queryParams.filter || '',
        sortOrder = queryParams.sortOrder,
        pageNumber = parseInt(queryParams.pageNumber) || 0,
        pageSize = parseInt(queryParams.pageSize);
  var nitems=pageNumber*pageSize;
      
        db.any('SELECT * FROM usuario LIMIT '+pageSize+' OFFSET '+nitems)
        .then(function (data) {
          var items=data;
            db.any("select count(*)  from usuario")
            .then(function (total) {
                res.status(200)
                .json({
                  result:'OK',
                  items:items,
                  totalCount:total[0].count
                }      
              );  
            })
            .catch(function (err) {
              console.log(err);
              res.status(400).json({
                result:'ERROR',
                message:err
              })
            });
        })
        .catch(function (err) {
          console.log(err);
          res.status(400).json({
            result:'ERROR',
            message:err
          })
        });         
}


function crudUsuario(req, res, next) {
    console.log([req.body.idusuario,req.body.nombres,req.body.apellidos,req.body.cedula,req.body.opcion,req.body.clave,req.body.rol]);
    var SQL = 'select * from  fun_ime_usuario($1, $2, $3, $4, $5, $6, $7);'
    db.any(SQL,[req.body.idusuario,
      req.body.nombres,
      req.body.apellidos,
      req.body.cedula,
      req.body.opcion,
      req.body.clave,
      req.body.rol])
      .then(function (data) {
      res.status(200)
      .json(data);
      })
      .catch(function (err) {
        console.log(err);
        res.status(500)
        .json(err);
      });
}





function login(req,res){
    var params=req.body;
    console.log(params);
    var password=params.password;
    var id=params.cedula;
    console.log(password);
    // console.log(params.gettoken);
    db.any('select * from usuario where cedula=$1',id)
      .then(function (user) {
          console.log('usuario traido de bdd:'+user);// user array de json de la tabla usuarios
          if(user[0]==null){
            res.status(200)
            .json({
              status: 'success',
              data: data,
              message: 'No existe este usuario'
            });     
            }else{
                var user=user[0];
                console.log(user.clave+' '+password);
                
                if(password == user.clave){
                    if(params.gettoken){
                        res.status(200).send({
                        token:jwt.createToken(user)
                        });
                    }else{
                    console.log('este es el usuario logueado:'+user);
                    res.status(200).send({user:user});
                    }
                }else{
                res.status(404).send({
                    message:'la contraseña no es correcta'
                });
                }
                
            }    
      })
      .catch(function (err) {
        console.log(err);
        res.status(404).send({
          message:err
         });
      });
  }


  
  function cambiarClave(req,res,next){
    console.log(req.body);
    var params=req.body;
    var clave=params.clave;
    var nuevaClave=params.nuevaClave;
    var id=params.idusuario;
    
    db.any('select * from usuario where idusuario=$1',id)
      .then(function (user) {
          console.log('usuario traido de bdd cc:'+user);// user array de json de la tabla usuarios
          console.log(user[0]);
          if(user[0]==null){
            res.status(200)
            .json({
              status: 'success',
              data: data,
              message: 'No existe este usuario'
            });     
            }else{
                var user=user[0];
                if(user.clave === clave){ 
                  var SQL = 'update usuario set clave=$1 where idusuario=$2';
                  db.any(SQL, [nuevaClave,id])
                  .then(function (data) {
                    console.log(data);
                    res.status(200)
                      .json({
                        status: 'success',
                        data: data
                      });
                  })
                  .catch(function (err) {
                    res.status(404).send(err);
                  });
               
                }
            }    
      })
      .catch(function (err) {
        console.log(err);
        res.status(500).send({
          message:err
         });
      });
  }
  

module.exports = {
  findUsuarios:findUsuarios,
  login:login,
  crudUsuario:crudUsuario,
  cambiarClave:cambiarClave
};
