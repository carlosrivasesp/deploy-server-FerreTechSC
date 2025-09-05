const express = require('express');
const ctrl = require('../controllers/personaController');
const router = express.Router();

router.get('/', ctrl.getPersonas);   
router.post('/clientes', ctrl.createCliente);
router.put('/:id', ctrl.updatePersona); 
router.put('/:id', ctrl.updateProveedor); 

module.exports = router;
