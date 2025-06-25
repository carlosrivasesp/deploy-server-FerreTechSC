const mongoose = require('mongoose');

const compraSugeridaSchema = new mongoose.Schema({
    producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto'
    },
    fechaSugerencia: {
        type: Date,
        default: Date.now
    },
    tieneOrdenCompra: {
        type: Boolean,
        default: false  
    }
});

const CompraSugerida = mongoose.model('CompraSugerida', compraSugeridaSchema);
module.exports = CompraSugerida;