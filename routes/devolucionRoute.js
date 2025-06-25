const express = require('express');
const router = express.Router();
const devolucionController = require('../controllers/devolucionController');

router.get('/', devolucionController.obtenerDevoluciones);
router.get('/:id', devolucionController.obtenerDevolucion);

module.exports = router;
