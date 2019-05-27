var express = require('express');
var router = express.Router();
var ImportacionController=require('./../controllers/importacion.controller');
var md_auth=require('../middlewares/authenticated');

// router.post('/getListaTipos', MaterialController.getListaTipos);

router.post('/findImportaciones',ImportacionController.findImportaciones);
router.post('/crudImportacion',md_auth.ensureAuth,ImportacionController.crudImportacion);
router.get('/findImportacionById/:idimportacion',ImportacionController.findImportacionById);

module.exports = router;
