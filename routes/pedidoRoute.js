const express=require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
router.post('/',pedidoController.registrarPedido)
router.get('/',pedidoController.obtenerPedidos);
router.get('/:nroDoc',pedidoController.obtenerPedidoCliente);
module.exports=router;