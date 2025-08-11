const mongoose = require("mongoose");

const entregasSchema = new mongoose.Schema({
  ventaId: { type: mongoose.Schema.Types.ObjectId, ref: "Venta" },
  direccion: {
    type: String,
    default: "Pendiente",
  },
  distrito: {
    type: String,
    default: "Pendiente",
    enum: ["Pendiente", "Surco", "Barranco", "Miraflores"]
  },
  estado: {
    type: String,
    enum: ["Pendiente", "En proceso", "Finalizado"],
    default: "Pendiente",
  },
  fechaEntrega: { type: Date, default: Date.now },
  costo: { type: Number, default: 0 },
});

module.exports = mongoose.model("Entrega", entregasSchema);
