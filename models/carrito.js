const mongoose = require('mongoose');


const carritoItemSchema = new mongoose.Schema({
producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
nombre: { type: String, required: true }, // snapshot para estabilidad
precio: { type: Number, required: true }, // snapshot de precio actual
imageUrl: { type: String },
cantidad: { type: Number, required: true, min: 1, default: 1 }
}, { _id: false });


const carritoSchema = new mongoose.Schema({
user: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, unique: true, index: true },
items: { type: [carritoItemSchema], default: [] }
}, { timestamps: true });


module.exports = mongoose.model('Carrito', carritoSchema);