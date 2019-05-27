'use strict'
var jwt=require('jwt-simple'); //libreria para cifrar claves
var moment=require('moment'); //libreria para manejo de fechas
var secret='clave_secreta_del_mia';

exports.createToken=function(user){ 
  var payload={
    idusuario: user.idusuario,
    nombres:user.nombres,
    apellidos:user.apellidos,
    clave:user.clave,
    rol:user.rol,
    estado:user.estado,
    // fecha:user.fecha,
    iat:moment().unix(),
    exp:moment().add(360,'days').unix
  };
  return jwt.encode(payload,secret);
}
