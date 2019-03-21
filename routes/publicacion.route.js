var express = require('express');
var router = express.Router();
var PublicacionController=require('./../controllers/publicacion.controller');

router.post('/crudPublicacion', PublicacionController.crudPublicacion); 
router.post('/findPublicaciones',PublicacionController.findPublicaciones);

module.exports = router;
