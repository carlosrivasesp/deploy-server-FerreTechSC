const mongoose = require('mongoose');

const MarcaSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    proveedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proveedor'
    }
});

module.exports = mongoose.model('Marca', MarcaSchema);