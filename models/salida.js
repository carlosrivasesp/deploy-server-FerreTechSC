const mongoose = require('mongoose');

const salidaSchema = new mongoose.Schema({
  tipoOperacion: {
      type: String,
      enum: ['Pedido despachado'],
      required: true,
    },
  pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Operacion' },
  cantidadTotal: { type: Number, required: true },
  fechaSalida: { type: Date, required: true }, 
  detalles: [{
    detalleId: { type: mongoose.Schema.Types.ObjectId, ref: 'DetalleOperacion' },
    cantidadSalida: { type: Number, required: true }
  }]
});

module.exports = mongoose.model('Salida', salidaSchema);

