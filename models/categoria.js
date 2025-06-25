const mongoose = require('mongoose');

const CategoriaSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    descripcion: { type: String }
});

module.exports = mongoose.model('Categoria', CategoriaSchema);