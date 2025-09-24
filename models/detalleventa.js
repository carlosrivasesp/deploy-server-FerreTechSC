const mongoose = require('mongoose');

const detalleVentaSchema = new mongoose.Schema({
    venta: { type: mongoose.Schema.Types.ObjectId, ref: 'Venta' },
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    codInt: String,
    nombre: String,
    cantidad: Number,
    precio: Number,
    subtotal: Number,
});

const DetalleVenta = mongoose.models.DetalleVenta || mongoose.model('DetalleVenta', detalleVentaSchema);
module.exports = DetalleVenta;

