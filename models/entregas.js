const mongoose = require("mongoose");

const entregasSchema = new mongoose.Schema({
  operacionId: { type: mongoose.Schema.Types.ObjectId, ref: "Operacion" },
  direccion: {
    type: String,
    default: "Pendiente",
  },
  distrito: {
    type: String,
    default: "Pendiente",
    enum: ["Pendiente", "Surco", "Barranco", "Miraflores"],
  },
  estado: {
    type: String, // ⭐️ CORRECCIÓN: Añadidos los estados que faltaban para sincronizar
    enum: ["Pendiente", "En proceso", "Enviado", "Finalizado", "Cancelado"],
    default: "Pendiente",
  },
  fechaEntrega: { type: Date, default: Date.now },
  costo: { type: Number, default: 0 },
  codigo: {
    type: String,
    unique: true,
    required: true,
  },
});

module.exports = mongoose.model("Entrega", entregasSchema);
