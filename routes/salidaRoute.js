const express = require('express');
const router = express.Router();
const salidaController = require('../controllers/salidaController');

router.get('/', salidaController.obtenerSalidas);
router.get('/:id', salidaController.obtenerSalida);

module.exports = router;
