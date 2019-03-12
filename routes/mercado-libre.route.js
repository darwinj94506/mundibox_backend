var express = require('express');
var router = express.Router();
var MercadoLibreController=require('./../controllers/mercado-libre.controller');

router.get('/subidaMasiva', MercadoLibreController.respuestaMec); 
router.get('/redireccionamiento', MercadoLibreController.redireccionamientoaMec); 


module.exports = router;
