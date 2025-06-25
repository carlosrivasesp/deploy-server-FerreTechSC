const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Usuario = require('../models/usuario');

exports.registerUsuario = async (req, res) => {
    try {
        if (req.body.rol === 'admin') {
            return res.status(403).json({ error: 'No autorizado para crear admins' });
        }

        // Validaciones existentes (dni, teléfono, correo)
        const dniExistente = await Usuario.findOne({ nroDoc: req.body.nroDoc });
        if (dniExistente) return res.status(400).json({ error: 'El dni ya está registrado' });

        const telefonoExistente = await Usuario.findOne({ telefono: req.body.telefono });
        if (telefonoExistente) return res.status(400).json({ error: 'El teléfono ya está registrado' });

        const correoExistente = await Usuario.findOne({ correo: req.body.correo });
        if (correoExistente) return res.status(400).json({ error: 'El correo ya está registrado' });

        const salt = await bcrypt.genSalt(10);
        const hashpassword = await bcrypt.hash(req.body.password, salt);

        const nuevoUsuario = new Usuario({
            ...req.body,
            password: hashpassword,
            rol: 'cliente'
        });

        await nuevoUsuario.save();
        res.status(201).json(nuevoUsuario);
    } catch (error) {
        if (error.message.includes('Ya existe un administrador')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ mensaje: 'Error en el servidor', error });
    }
};

exports.iniciarSesion = async (req, res) => {
  try {
    console.log('[DEBUG] JWT_SECRET:', process.env.JWT_SECRET ? '*** (presente)' : 'FALTANTE');
    console.log('[AUTH] Inicio de sesión solicitado para:', req.body.correo);
    
    // Validación básica
    if (!req.body.correo || !req.body.password) {
      console.log('[ERROR] Faltan credenciales');
      return res.status(400).json({ error: 'Correo y contraseña requeridos' });
    }

    // Normalización de correo
    const correo = req.body.correo.trim().toLowerCase();
    console.log('[AUTH] Correo normalizado:', correo);

    // Buscar usuario
    const usuario = await Usuario.findOne({ correo });
    
    if (!usuario) {
      console.log('[AUTH] Usuario no encontrado');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    console.log('[AUTH] Usuario encontrado:', usuario._id);
    
    // Comparación de contraseñas con manejo de errores
    let passwordCorrecto;
    try {
      passwordCorrecto = await bcrypt.compare(
        req.body.password,
        usuario.password
      );
    } catch (bcryptErr) {
      console.error('[BCRYPT ERROR]', bcryptErr);
      return res.status(500).json({ error: 'Error en comparación de contraseña' });
    }

    console.log('[AUTH] Resultado comparación:', passwordCorrecto);
    
    if (!passwordCorrecto) {
      console.log('[AUTH] Contraseña incorrecta');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar existencia de JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('[FATAL] JWT_SECRET no configurado');
      return res.status(500).json({ error: 'Error de configuración del servidor' });
    }

    // Generar token
    const token = jwt.sign(
    { id: usuario._id },
    process.env.JWT_SECRET, // <-- Usando la variable
    { expiresIn: '1h' }
    );

    console.log('[AUTH] Token generado para:', usuario.correo);
    
    res.status(200).json({
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('[AUTH ERROR]', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    
    res.status(500).json({ 
      mensaje: 'Error en el servidor',
      error: error.message
    });
  }
};