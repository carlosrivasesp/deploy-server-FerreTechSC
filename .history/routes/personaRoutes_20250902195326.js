const express = require('express');
const ctrl = require('../controllers/personaController');
const router = express.Router();

router.get('/', ctrl.getPersonas);   // GET general con ?tipo=1 o ?tipo=2
router.put('/:id', ctrl.updatePersona); // actualizar solo estado, telefono y correo

module.exports = router;
