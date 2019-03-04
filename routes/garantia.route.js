var express = require('express');
var router = express.Router();
var GarantiaController=require('./../controllers/garantia.controller');


var buscar_upcController=require('./../controllers/bucar_upc.controller');
router.post('/crudGarantia',GarantiaController.crudGarantia);
router.post('/getGarantias',GarantiaController.getGarantias);
router.post('/getListaProveedores',GarantiaController.getListaProveedores);
router.post('/getTotalGarantias',GarantiaController.getTotalGarantias);
router.get('/getGarantiasSelect/:idproveedor',GarantiaController.getGarantiaSelect);
router.post('/buscarupc',buscar_upcController.buscarUPC);
module.exports = router;
