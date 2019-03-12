var express = require('express');
var router = express.Router();
var ImportacionProductoController=require('./../controllers/importacion-producto.controller');


router.post('/crudImportacionProducto',ImportacionProductoController.crudImportacionProducto);
router.post('/findProductosByImportacion',ImportacionProductoController.findProductosByImportacion);


module.exports = router;
