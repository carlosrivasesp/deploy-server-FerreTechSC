const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
        tipoDoc: {
        type: String,
        enum: ['DNI', 'RUC'],
        required: true
    },
    nroDoc: { type: String, required: true, unique: true, trim: true },
    telefono: { type: String, trim: true },
    correo: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, trim: true },
    rol: { 
        type: String, 
        enum: ['admin', 'cliente'], 
        default: 'cliente',
        validate: {
            validator: async function(rol) {
                if (rol === 'admin') {
                    const existingAdmin = await mongoose.model('Usuario').findOne({ rol: 'admin' });
                    return !existingAdmin; // Valida que no exista otro admin
                }
                return true;
            },
            message: 'Ya existe un administrador en el sistema'
        }
    }
});

usuarioSchema.post('save', async function(doc) {
  if (doc.rol === 'cliente') {
    const Cliente = mongoose.model('Cliente'); 
    await Cliente.create({
      nombre: doc.nombre,
      tipoDoc: doc.tipoDoc === 'dni' ? 'DNI' : 'RUC',
      nroDoc: doc.nroDoc,
      telefono: doc.telefono,
      correo: doc.correo,
      estado: 'Activo'
    });
  }
});

module.exports = mongoose.model('Usuario', usuarioSchema);