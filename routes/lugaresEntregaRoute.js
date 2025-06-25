const express = require('express');
const router = express.Router();
const lugaresEntregaController = require('../controllers/lugaresEntregaController');

router.post('/', lugaresEntregaController.createLugar);
router.get('/', lugaresEntregaController.getLugaresEntrega);
router.get('/lugaresEntrega', lugaresEntregaController.exportLugares);
router.get('/:id', lugaresEntregaController.getLugarEntrega);
router.put('/:id', lugaresEntregaController.updateLugar);

module.exports = router;
