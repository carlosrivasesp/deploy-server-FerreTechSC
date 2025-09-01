const mongoose = require('mongoose');

const detalleOperacionSchema = new mongoose.Schema({
    operacion: { type: mongoose.Schema.Types.ObjectId, ref: 'Operacion' },
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    codInt: String ,
    nombre: String ,
    cantidad: Number,
    precio: Number,
    subtotal: Number,
});

const DetalleOperacion = mongoose.model('DetalleOperacion', detalleOperacionSchema);
module.exports = DetalleOperacion;
