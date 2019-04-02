var express = require('express');
var router = express.Router();
var TipoController = require('./../controllers/tipo.controller');

router.post('/findTipos', TipoController.findTipos);
router.get('/getTipo/:id', TipoController.getTipo);
router.post('/crudTipo', TipoController.crudTipo);
router.get('/getCategorias', TipoController.getTiposSelect);

module.exports = router;