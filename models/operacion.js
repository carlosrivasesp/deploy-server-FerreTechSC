const mongoose = require('mongoose');


const operacionSchema = new mongoose.Schema({
    tipoOperacion: {
        type: Number,
        enum: [1, 2], //1 = pedido, 2 = cotizacion
    },
    nroOperacion:{
        type: Number,
    },
    detalles: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'DetalleOperacion'
    }],
    servicioDelivery: {
        type: Boolean,
    },
    cliente: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Cliente',
        required: true
    },
    igv: {
        type: Number
    },
    total: {
        type: Number
    },
    estado: {
        type: String
    },
    fechaEmision: {
        type: Date,
        default: Date.now(),
    },
    fechaVenc: {
        type: Date,
        default: Date.now(),
    },
    salidas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Salida' }],
})

const Operacion = mongoose.model('Operacion', operacionSchema);
module.exports = Operacion;