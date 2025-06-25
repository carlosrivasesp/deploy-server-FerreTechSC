const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');

router.post('/', proveedorController.registerProveedor)
router.get('/', proveedorController.getProveedores)
router.put('/:id', proveedorController.editProveedor)
router.get('/:id', proveedorController.getProveedor)
router.delete('/:id', proveedorController.deleteProveedor)

module.exports = router;