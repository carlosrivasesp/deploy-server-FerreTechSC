const mongoose = require('mongoose');

const operacionSchema = new mongoose.Schema({
    tipoOperacion: {
        type: Number,
        enum: [1, 2, 3],
    },
    tipoComprobante: {
        type: String,
    },
    nroComprobante: {
        type: String
    },
    serie:{
        type: String
    },
    detalles: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'DetalleOperacion'
    }],
    metodoPago: {
        type: String
    },
    servicioDelivery: {
        type: Boolean,
    },
    cliente: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Cliente',
    },
    proveedor: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Proveedor',
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
    }
})

const Operacion = mongoose.model('Operacion', operacionSchema);
module.exports = Operacion;