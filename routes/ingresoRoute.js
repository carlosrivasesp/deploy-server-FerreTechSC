const express = require('express');
const router = express.Router();
const ingresoController = require('../controllers/ingresoController');

router.get('/', ingresoController.obtenerIngresos);
router.get('/:id', ingresoController.obtenerIngreso);

module.exports = router;
