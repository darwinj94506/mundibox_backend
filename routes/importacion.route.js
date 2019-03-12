var express = require('express');
var router = express.Router();
var ImportacionController=require('./../controllers/importacion.controller');

// router.post('/getListaTipos', MaterialController.getListaTipos);

router.post('/findImportaciones',ImportacionController.findImportaciones);
router.post('/crudImportacion',ImportacionController.crudImportacion);
router.get('/findImportacionById/:idimportacion',ImportacionController.findImportacionById);

module.exports = router;
