const express = require('express');
const reniecController=require("../controllers/servicioExterno.js"); 

const router = express.Router();
// Ruta: GET /api/reniec/:dni
router.get("/:dni", reniecController.consultarReniec);

module.exports = router;