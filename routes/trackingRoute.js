// C:\Users\alero\OneDrive\Documentos\GitHub\TEST\deploy-server-FerreTechSC\routes\trackingRoute.js

const express = require('express');
const router = express.Router();

// Importamos la función específica del controlador
const { getTrackingByCode } = require('../controllers/trackingController');

/*
 * @route   GET /api/tracking/:codigo
 * @desc    Ruta pública para que un cliente consulte el estado de su pedido.
 * @access  Public
 *
 * Ejemplo de uso:
 * GET http://localhost:4000/api/tracking/vZoOqO
 * GET http://localhost:4000/api/tracking/jDLMEw
 */
router.get('/:codigo', getTrackingByCode);

module.exports = router;