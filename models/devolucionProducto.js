const mongoose = require('mongoose');

const DevolucionProductoSchema = mongoose.Schema({
  ventaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venta' },
  cantidadTotal: { type: Number, required: true },
  fechaDevolucion: { type: Date, default: Date.now },
  detalles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DetalleVenta' }]
});

module.exports = mongoose.model('DevolucionProducto', DevolucionProductoSchema);
