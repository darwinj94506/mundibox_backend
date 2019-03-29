var express = require('express');
var router = express.Router();
var UsuarioController=require('./../controllers/usuario.controller');

router.post('/crudUsuario', UsuarioController.crudUsuario); 
router.post('/login', UsuarioController.login); 
router.post('/cambiarclave', UsuarioController.cambiarClave); 
router.post('/findUsuarios',UsuarioController.findUsuarios);
router.post('/getUsuariosSelect', UsuarioController.getUsuariosSelect); 

module.exports = router;
