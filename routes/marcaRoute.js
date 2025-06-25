const express = require('express');
const router = express.Router();
const marcaController = require('../controllers/marcaController');

router.post('/', marcaController.registerMarca)
router.get('/', marcaController.getMarcas)
router.put('/:id', marcaController.editMarca)
router.get('/:id', marcaController.getMarca)
router.delete('/:id', marcaController.deleteMarca)

module.exports = router;