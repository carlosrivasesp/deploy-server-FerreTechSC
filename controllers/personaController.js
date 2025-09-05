const mongoose = require('mongoose');
const Persona = require('../models/persona');


exports.getPersonas = async (req, res) => {
  try {
    const { tipoPersona } = req.query;

    let filter = {};
    if (tipoPersona) {
      filter.tipoPersona = tipoPersona;
    }

    const personas = await Persona.find(filter);
    res.json(personas);
  } catch (err) {
    console.error('getPersonas error:', err);
    res.status(500).json({ message: 'Error obteniendo personas' });
  }
};


exports.updatePersona = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const { estado, telefono, correo } = req.body;

    const updates = {};
    if (estado) updates.estado = estado; // 'Activo' o 'Inactivo'
    if (telefono) updates.telefono = telefono.trim();
    if (correo) updates.correo = correo.trim().toLowerCase();

    const persona = await Persona.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!persona) {
      return res.status(404).json({ message: 'Persona no encontrada' });
    }

    res.json(persona);
  } catch (err) {
    console.error('updatePersona error:', err);
    res.status(500).json({ message: 'Error actualizando persona' });
  }
};

exports.createCliente = async (req, res) => {
  try {
    const { nombre, tipoDoc, nroDoc, telefono, correo } = req.body;

    // Validaciones básicas
    if (!nombre || !tipoDoc || !nroDoc) {
      return res.status(400).json({ message: 'nombre, tipoDoc y nroDoc son obligatorios' });
    }
    if (!['DNI', 'RUC'].includes(tipoDoc)) {
      return res.status(400).json({ message: "tipoDoc debe ser 'DNI' o 'RUC'" });
    }

    // Normalizaciones
    const payload = {
      nombre: nombre,
      tipoDoc,
      nroDoc: String(nroDoc).trim(),
      telefono: telefono?.trim(),
      correo: correo?.trim()?.toLowerCase(),
      estado: 'Activo',        // por defecto
      tipoPersona: 1,          // Cliente
    };

    // Verificar nroDoc único
    const exists = await Persona.findOne({ nroDoc: payload.nroDoc });
    if (exists) {
      return res.status(409).json({ message: 'cliente ya registrado' });
    }

    const persona = await Persona.create(payload);
    return res.status(201).json(persona);
  } catch (err) {
    console.error('createCliente error:', err);

  }
};

exports.createProveedor = async (req, res) => {
  try {
    const { nombre, tipoDoc, nroDoc, telefono, correo } = req.body;

    // Validaciones básicas
    if (!nombre || !tipoDoc || !nroDoc) {
      return res.status(400).json({ message: 'nombre, tipoDoc y nroDoc son obligatorios' });
    }
    if (!['DNI', 'RUC'].includes(tipoDoc)) {
      return res.status(400).json({ message: "tipoDoc debe ser 'DNI' o 'RUC'" });
    }

    // Normalizaciones
    const payload = {
      nombre: nombre,
      tipoDoc,
      nroDoc: String(nroDoc).trim(),
      telefono: telefono?.trim(),
      correo: correo?.trim()?.toLowerCase(),
      estado: 'Activo',        // por defecto
      tipoPersona: 2,          // Proveedor
    };

    // Verificar nroDoc único
    const exists = await Persona.findOne({ nroDoc: payload.nroDoc });
    if (exists) {
      return res.status(409).json({ message: 'proveedor ya registrado' });
    }

    const persona = await Persona.create(payload);
    return res.status(201).json(persona);
  } catch (err) {
    console.error('createProveedor error:', err);
    res.status(500).json({ message: 'Error al crear proveedor' });
  }
};
