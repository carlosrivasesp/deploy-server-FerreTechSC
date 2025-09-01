const express = require('express');
const router = express.Router();
const operacionController = require('../controllers/operacionController');

router.post('/venta/', operacionController.registrarVenta);
router.post('/compra/', operacionController.registrarCompra);
router.post('/cotizacion/', operacionController.registrarCotizacion);
router.get('/', operacionController.obtenerOperaciones);
router.get('/:id', operacionController.obtenerOperacion);
router.put('/:id/estado', operacionController.actualizarEstado);

module.exports = router;