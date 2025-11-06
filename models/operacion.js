// C:\Users\alero\OneDrive\Documentos\GitHub\TEST\deploy-server-FerreTechSC\models\operacion.js

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
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Cliente', // <-- ¡Esto es crucial para que populate funcione!
    required: true
    },
    igv: {
        type: Number
    },
    total: {
        type: Number
    },
    estado: {
        type: String,
        enum: ['Pagado', 'En preparacion', 'Enviado', 'Entregado'],
        default: 'Pagado'
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
    codigo: { type: String }
})

// Exporta el MODELO
const Operacion = mongoose.model('Operacion', operacionSchema, 'operaciones'); //Asegúrate de apuntar a la colección 'operaciones'
module.exports = Operacion;