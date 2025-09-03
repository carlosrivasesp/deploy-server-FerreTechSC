const mongoose = require('mongoose');
const Persona = require('../models/persona');

// GET /api/personas/clientes
exports.getClientes = async (req, res) => {
  try {
    const clientes = await Persona.find({ tipoPersona: 1 });
    res.json(clientes);
  } catch (err) {
    console.error('getClientes error:', err);
    res.status(500).json({ message: 'Error obteniendo clientes' });
  }
};

// GET /api/personas/proveedores
exports.getProveedores = async (req, res) => {
  try {
    const proveedores = await Persona.find({ tipoPersona: 2 });
    res.json(proveedores);
  } catch (err) {
    console.error('getProveedores error:', err);
    res.status(500).json({ message: 'Error obteniendo proveedores' });
  }
};

// PUT o PATCH /api/personas/:id
// Solo actualizar estado, telefono y correo
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
