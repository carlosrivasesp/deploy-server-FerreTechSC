const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  tipoDoc: {
    type: String,
    enum: ['DNI', 'RUC'],
    required: true
  },
  nroDoc: { type: String, required: true, unique: true, trim: true },
  telefono: { type: String, trim: true },
  correo: { type: String, trim: true },
  estado: { type: String, enum: ['Activo', 'Inactivo'], default: 'Activo' }
}, { timestamps: true });

module.exports = mongoose.model('Cliente', clienteSchema)

/*
validate: {
            validator: function (v) {
                return /@(gmail\.com|hotmail\.com|outlook\.es)$/.test(v);
            },
            message: props => `${props.value} no es un correo válido. Solo se aceptan @gmail.com, @hotmail.com o @outlook.es.`
        }
*/