const express=require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
router.post('/',pedidoController.registrarPedido)
router.get('/',pedidoController.obtenerPedidos);
module.exports=router;