const mongoose = require("mongoose");

const detalleCotizacionSchema = new mongoose.Schema({
  cotizacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cotizacion",
    required: true,
  },
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Producto", // Asegúrate de que el modelo Producto esté correctamente definido
    required: true,
  },
  nombre: {
    type: String,
    required: true,
  },
  cantidad: {
    type: Number,
    required: true,
  },
  precio: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
});

const DetalleCotizacion = mongoose.model(
  "DetalleCotizacion",
  detalleCotizacionSchema,
  "detallecotizaciones"
);
module.exports = DetalleCotizacion;
