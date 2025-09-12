const mongoose = require('mongoose');

const detallePedidoSchema = new mongoose.Schema({
    pedido: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido' },
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    codInt: String ,
    nombre: String ,
    cantidad: Number,
    precio: Number,
    subtotal: Number,
});

const detallePedido = mongoose.model('detallePedido', detallePedidoSchema);
module.exports = detallePedido;

