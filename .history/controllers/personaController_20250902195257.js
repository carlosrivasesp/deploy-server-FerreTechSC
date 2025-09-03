const mongoose = require('mongoose');
const Persona = require('../models/persona');

// GET /api/personas?tipo=1   (1 = Cliente, 2 = Proveedor)
exports.getPersonas = async (req, res) => {
  try {
    const { tipo } = req.query;

    let filter = {};
    if (tipo) {
      if (![ '1', '2' ].includes(tipo)) {
        return res.status(400).json({ message: "El parámetro 'tipo' debe ser 1 (Cliente) o 2 (Proveedor)" });
      }
      filter.tipoPersona = Number(tipo);
    }

    const personas = await Persona.find(filter);
    res.json(personas);
  } catch (err) {
    console.error('getPersonas error:', err);
    res.status(500).json({ message: 'Error obteniendo personas' });
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
