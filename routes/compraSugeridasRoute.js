const express = require('express');
const router = express.Router();
const { getComprasSugeridas } = require('../controllers/compraSugeridaController');
const { generarSugerenciasFaltantes } = require("../controllers/compraSugeridaController");
const { marcarOrdenGenerada } = require('../controllers/compraSugeridaController');
const {exportComprasSugeridas} = require ('../controllers/compraSugeridaController');

router.get('/export', exportComprasSugeridas); // Nueva ruta de exportación

router.get('/', getComprasSugeridas);
router.post("/generar-faltantes", generarSugerenciasFaltantes);
router.put('/marcar-orden/:id', marcarOrdenGenerada);

module.exports = router;