const express = require('express');
const router = express.Router();

const ventaController = require('../controllers/ventaController');
const detalleVentaController = require('../controllers/detalleventaController');

// ==============================
// 🔹 CRUD PRINCIPAL DE VENTAS
// ==============================
router.post('/', ventaController.registrarVenta);      // Crear nueva venta
router.get('/', ventaController.obtenerVentas);        // Obtener todas las ventas
router.get('/:id', ventaController.obtenerVenta);      // Obtener venta por ID
router.put('/:id', ventaController.actualizarVenta);   // Actualizar venta existente

// ==============================
// 🔹 DETALLES DE VENTA
// ==============================
router.get('/detalles/listado', detalleVentaController.obtenerDetallesVenta); // Detalles generales de ventas

// ==============================
// 🔹 EXPORTACIONES DE VENTAS
// ==============================
router.get('/exportar/facturas', ventaController.exportFacturas);
router.get('/exportar/boletas', ventaController.exportBoletas);
router.get('/exportar/efectivo', ventaController.exportEfectivo);
router.get('/exportar/otros', ventaController.exportOtros);
router.get('/exportar/listado-general', ventaController.exportVentasGeneral);

module.exports = router;
