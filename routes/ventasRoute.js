const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const detalleVentaController = require('../controllers/detalleventaController');

router.post('/', ventaController.registrarVenta);
router.get('/', ventaController.obtenerVentas);
router.get('/detalles', detalleVentaController.obtenerDetallesVenta);

router.get('/exportar-facturas', ventaController.exportFacturas);
router.get('/exportar-boletas', ventaController.exportBoletas);
router.get('/exportar-efectivo', ventaController.exportEfectivo);
router.get('/exportar-otros', ventaController.exportOtros);
router.get('/exportar-listado-general', ventaController.exportVentasGeneral);


router.get('/:id', ventaController.obtenerVenta);
router.put('/:id', ventaController.actualizarVenta);

module.exports = router;
