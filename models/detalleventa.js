const mongoose = require('mongoose');

const detalleVentaSchema = new mongoose.Schema({
    venta: { type: mongoose.Schema.Types.ObjectId, ref: 'Venta' }, // Referencia a la venta
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    lugar: { type: mongoose.Schema.Types.ObjectId, ref: 'LugaresEntrega' },
    codInt: String ,
    nombre: String ,
    cantidad: Number,
    precio: Number,
    codigoL: String,
    distrito: String,
    costoL: Number,
    subtotal: Number,
});

const DetalleVenta = mongoose.model('DetalleVenta', detalleVentaSchema);
module.exports = DetalleVenta;
