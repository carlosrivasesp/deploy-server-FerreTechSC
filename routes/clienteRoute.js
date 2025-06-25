const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

router.post('/', clienteController.registerCliente);
router.get('/', clienteController.getClientes);
router.put('/:id', clienteController.editCliente);
router.get('/:id', clienteController.getCliente);
router.delete('/:id', clienteController.deleteCliente);

// Exportación de reportes en Excel
router.get('/exportar/naturales', clienteController.exportClientesNaturales);
router.get('/exportar/empresas', clienteController.exportClientesEmpresas);
router.get('/exportar/inactivos', clienteController.exportClientesInactivos);
router.get('/exportar/nuevos', clienteController.exportClientesNuevos);
router.get('/exportar/frecuentes', clienteController.exportClientesFrecuentes);

module.exports = router;
