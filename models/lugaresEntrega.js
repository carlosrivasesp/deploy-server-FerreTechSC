const mongoose = require('mongoose');

const LugaresSchema = mongoose.Schema({
    codigo: {
        type: Number,
        required: true,
        unique: true
    },
    distrito: {
        type: String,
        required: true
    },
    costo: {
        type: Number,
        required: true
    },
    inicio: {
        type: Number,
        required: true
    },
    fin: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('LugaresEntrega', LugaresSchema)