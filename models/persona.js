const mongoose = require('mongoose');

const personaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  tipoDoc: {
    type: String,
    enum: ['DNI', 'RUC'],
    required: true
  },
  nroDoc: { type: String, required: true, unique: true, trim: true },
  telefono: { type: String, trim: true },
  correo: { type: String, trim: true },
  estado: { type: String, enum: ['Activo', 'Inactivo'], default: 'Activo' },
  tipoPersona: {
    type: Number,
    enum: [1, 2], // 1 para Cliente, 2 para Proveedor
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Persona', personaSchema);
