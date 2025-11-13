const express = require('express');
const router = express.Router();
const productoProveedorController = require('../controllers/productoProveedorController');

router.post('/', productoProveedorController.registrarProductoProveedor);
router.get('/', productoProveedorController.obtenerProductosProveedor);
router.get('/:id', productoProveedorController.obtenerProductoProveedorPorId);

module.exports = router;
