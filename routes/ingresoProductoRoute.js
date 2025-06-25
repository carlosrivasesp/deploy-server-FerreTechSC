const express = require('express');
const router = express.Router();
const ingresoController = require('../controllers/ingresoProductoController');

router.get('/', ingresoController.obtenerIngresos);
router.get('/:id', ingresoController.obtenerIngreso);

module.exports = router;
