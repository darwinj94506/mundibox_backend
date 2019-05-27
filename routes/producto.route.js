var express = require('express');
var router = express.Router();
var ProductoController = require('./../controllers/producto.controller');
var buscar_upcController = require('./../controllers/bucar_upc.controller');

var multipart = require('connect-multiparty');
var md_upload=multipart({uploadDir:'./public/images'});
// router.post('/getListaTipos', MaterialController.getListaTipos);
router.post('/upload_images/:id',md_upload,ProductoController.uploadImage);
// router.post('/upload_images', ProductoController.uploadImage);
router.post('/getMaterialesSelect2', ProductoController.getMaterialesSelect2);
router.post('/findProductos', ProductoController.findProductos);
router.post('/crudProducto', ProductoController.crudProducto);
router.get('/findProductoByCodigoFabricante/:codigofabricante', ProductoController.findProductoByCodigoFabricante);
router.get('/findProductosByCodigoFabricante/:codigofabricante', ProductoController.findProductosByCodigoFabricante);

router.get('/getImageProducto/:imageFile',ProductoController.getImageFile);
// router.post('/findProductosByImportacion',ProductoController.findProductosByImportacion);
router.post('/buscarupc', buscar_upcController.buscarUPC);
module.exports = router;