const express = require('express');
const router = express.Router();
const cotizacionController = require('../controllers/cotizacionController');
const detalleCotizacionController = require('../controllers/detalleCotizacionController');


router.post('/', cotizacionController.registrarCotizacion);

router.put('/:id', cotizacionController.actualizarCotizacion);



router.get('/', cotizacionController.obtenerCotizaciones);

router.get('/:id', cotizacionController.obtenerCotizacion);


router.get('/detallesCotizacion', detalleCotizacionController.obtenerDetallesCotizacion);

router.get('/detalles-por-venta/:id', cotizacionController.obtenerDetallesCotizacionPorVenta);

router.get('/exportar/emitidas', cotizacionController.exportCotizacionesEmitidas);

router.get('/exportar/pendientes', cotizacionController.exportCotizacionesPendientes);

router.get('/exportar/aceptadas', cotizacionController.exportCotizacionesAceptadas);

router.get('/exportar/rechazadas', cotizacionController.exportCotizacionesRechazadas);

router.get('/exportar/convertidas', cotizacionController.exportCotizacionesConvertidas);

module.exports = router;
