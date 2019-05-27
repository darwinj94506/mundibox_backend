var express = require('express');
var router = express.Router();
var MercadoLibreController=require('./../controllers/mercado-libre.controller');

router.get('/subidaMasiva', MercadoLibreController.respuestaMec);
router.post('/notificaciones-DE-MEC-PARA-DJGCH-506-878', MercadoLibreController.notificaciones);  
router.get('/redireccionamiento', MercadoLibreController.redireccionamientoaMec); 
router.post('/publicarMec',MercadoLibreController.publicarProducto);
router.post('/actualizarStockMec',MercadoLibreController.actualizarStock);

module.exports = router;
