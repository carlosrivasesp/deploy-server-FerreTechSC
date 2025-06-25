const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');


// Ruta para REGISTRO
router.post('/register', usuarioController.registerUsuario);  // POST /register

// Ruta para INICIO DE SESIÓN
router.post('/login', usuarioController.iniciarSesion);      // POST /login
/*
router.post('/', usuarioController.registerUsuario)
router.post('/', usuarioController.iniciarSesion)
*/

module.exports = router;