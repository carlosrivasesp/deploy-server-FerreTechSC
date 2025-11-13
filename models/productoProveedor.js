const mongoose = require('mongoose');

const productoProveedorSchema = mongoose.Schema({
    codInt: {
        type: String,
        required: true,
        unique: true
    },
    nombre: {
        type: String,
        required: true
    },
    precio: {
        type: Number,
        required: true
    },
    categoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categoria',
        required: true
    },
    marca: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Marca',
        required: true
    },
});

module.exports = mongoose.model('ProductoProveedor', productoProveedorSchema)