const mongoose = require("mongoose");

const detalleCompraSchema = new mongoose.Schema({
  compra: { type: mongoose.Schema.Types.ObjectId, ref: "Compra" },
  producto: { type: mongoose.Schema.Types.ObjectId, ref: "Producto" },
  codInt: String,
  nombre: String,
  cantidad: Number,
  precio: Number,
  subtotal: Number,
});

const DetalleCompra = mongoose.model("DetalleCompra", detalleCompraSchema);
module.exports = DetalleCompra;
