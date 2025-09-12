const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  nroPedido: { type: String },
  fechaEmision: { type: Date, default: Date.now },
  Cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
  detalles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'detallePedido' }],
  estado: { type: String, enum: ['Pagado', 'Entregado'], default: 'Pagado', required: true },
  total: { type: Number, required: true },
  igv: { type: Number, required: true }
});

module.exports = mongoose.model('Pedido', pedidoSchema);
