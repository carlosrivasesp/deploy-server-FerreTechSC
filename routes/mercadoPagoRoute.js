const express = require('express');
const router = express.Router();
const mercadoPagoController = require('../controllers/mercadoPagoController');

// POST /api/mercado-pago/crear-preferencia
router.post('/crear-preferencia', mercadoPagoController.crearPreferencia);
router.post("/webhook", mercadoPagoController.webhook);

module.exports = router;

