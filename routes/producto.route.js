var express = require('express');
var router = express.Router();
var ProductoController = require('./../controllers/producto.controller');
var buscar_upcController = require('./../controllers/bucar_upc.controller');

var multipart = require('connect-multiparty');
var carpeta_destino_imagen = multipart({ uploadDir: './public/images/productos' });

// router.post('/getListaTipos', MaterialController.getListaTipos);
router.post('/getMaterialesSelect2', ProductoController.getMaterialesSelect2);
router.post('/findProductos', ProductoController.findProductos);
router.post('/crudProducto', ProductoController.crudProducto);
router.get('/findProductoByCodigoFabricante/:codigofabricante', ProductoController.findProductoByCodigoFabricante);
// router.post('/findProductosByImportacion',ProductoController.findProductosByImportacion);
router.post('/buscarupc', buscar_upcController.buscarUPC);
module.exports = router;