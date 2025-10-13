const mongoose = require('mongoose');

const ingresoSchema = mongoose.Schema({
  tipoOperacion: {
    type: String,
    enum: ['Compra Registrada', 'Venta Anulada', 'Devolución'],
    required: true,
  },
  compraId: { type: mongoose.Schema.Types.ObjectId, ref: 'Compra' },
  ventaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venta' },
  cantidadTotal: { type: Number, required: true },
  fechaIngreso: { type: Date, default: Date.now },
  detalles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DetalleVenta' }],
  detalleC: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DetalleCompra' }]
});

module.exports = mongoose.model('ingreso', ingresoSchema);
