const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');
const detalleCompraController = require('../controllers/detalleCompraController');

router.get('/total', compraController.exportListadoGeneral);
router.get('/facturas', compraController.exportFacturas);
router.get('/boletas', compraController.exportBoletas);
router.get('/proveedor', compraController.exportByProveedor);

router.post('/', compraController.registrarCompra);
router.get('/', compraController.obtenerCompras);
router.get('/detalles', detalleCompraController.obtenerDetallesCompra);
router.get('/:id', compraController.obtenerCompra);
router.put('/:id', compraController.actualizarCompra);



module.exports = router;
