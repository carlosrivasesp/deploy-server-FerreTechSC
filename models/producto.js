const mongoose = require('mongoose');

const productoSchema = mongoose.Schema({
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
    stockActual: {
        type: Number,
        default: 0
    },
    stockMin: {
        type: Number,
        default: 9
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
    estado: {
        type: String, 
        enum: ['Activo', 'Descontinuado']
    },
    imageUrl: {
        type: String
    }
});

module.exports = mongoose.model('Producto', productoSchema)