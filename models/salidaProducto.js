const mongoose = require('mongoose');

const salidaSchema = new mongoose.Schema({
  tipoOperacion: {
      type: String,
      enum: ['Venta Registrada'],
      required: true,
    },
    ventaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venta' },
    cantidadTotal: { type: Number, required: true },
    fechaSalida: { type: Date, default: Date.now },
    detalles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DetalleVenta' }]
});

module.exports = mongoose.model('Salida', salidaSchema);

