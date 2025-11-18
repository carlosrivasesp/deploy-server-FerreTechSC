const mongoose = require("mongoose");

const ordenCompraSchema = new mongoose.Schema({
  fechaCreacion: { type: Date, default: Date.now },

  codigo: { type: String },
  
  estado: {
    type: String,
    enum: ["Pendiente", "Aprobada", "Cancelada"],
    default: "Pendiente",
  },

  proveedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Proveedor",
    required: true,
  },

  detalles: [{ type: mongoose.Schema.Types.ObjectId, ref: "DetalleCompra" }],

  total: { type: Number, required: true },

  ingresos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ingreso" }],
});

module.exports = mongoose.model("OrdenCompra", ordenCompraSchema);
