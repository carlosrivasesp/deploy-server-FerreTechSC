const mongoose = require('mongoose');

const ingresoSchema = new mongoose.Schema({
  tipoOperacion: {
      type: String,
      enum: ['Orden de compra aprobada'],
      required: true,
  },
  compraId: { type: mongoose.Schema.Types.ObjectId, ref: 'Compra' },
  fechaIngreso: { type: Date, default: Date.now },
  cantidadTotal: Number,
  detalles: [{
    detalleId: { type: mongoose.Schema.Types.ObjectId, ref: 'DetalleCompra' },
    cantidadIngreso: Number
  }]
});

module.exports = mongoose.model('Ingreso', ingresoSchema);
