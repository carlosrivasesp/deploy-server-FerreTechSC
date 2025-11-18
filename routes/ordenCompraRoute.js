const express = require('express');
const router = express.Router();
const compraController = require('../controllers/ordenCompraController');

router.post('/', compraController.registrarOrdenCompra);
router.get('/', compraController.obtenerOrdenes);
router.get('/:id', compraController.obtenerOrden);
router.put('/estado/:id', compraController.actualizarOrden);

module.exports = router;