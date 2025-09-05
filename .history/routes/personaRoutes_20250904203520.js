const express = require('express');
const ctrl = require('../controllers/personaController');
const router = express.Router();

router.get('/', ctrl.getPersonas);   
router.post('/clientes', ctrl.createCliente);
router.post('/proveedores', ctrl.createProveedor);
router.put('/:id', ctrl.updatePersona); 

module.exports = router;
