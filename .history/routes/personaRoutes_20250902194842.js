const express = require('express');
const ctrl = require('../controllers/personaController');
const router = express.Router();

router.get('/clientes', ctrl.getClientes);
router.get('/proveedores', ctrl.getProveedores);
router.put('/:id', ctrl.updatePersona);   // o PATCH si prefieres

module.exports = router;
