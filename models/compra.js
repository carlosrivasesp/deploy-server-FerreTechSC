const mongoose = require('mongoose');

const compraSchema = new mongoose.Schema({
    fechaEmision: { type: Date, default: Date.now },
    fechaVenc: { type: Date, default: Date.now },
    tipoComprobante: { 
        type: String, 
        enum: ['FACTURA DE COMPRA ELECTRONICA', 'BOLETA DE COMPRA ELECTRONICA'], 
        required: true 
    }, 
    nroComprobante: { type: String },  // Se generará automáticamente
    serie: { type: String, enum: ['F01','B01']}, // Se asignará automáticamente en el middleware
    detalleC: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DetalleCompra' }], 
    moneda: { type: String, default: 'S/', enum: ['S/'] }, 
    tipoCambio: { type: Number, default: 3.66 }, 
    // tipoPago: { type: String, enum: ['Directo', 'Cuotas'], required: true },
    metodoPago:{type:String,enum:['Transferencia', 'Efectivo', 'Tarjeta de credito', 'Tarjeta de debito', 'Yape', 'Plin'], required:true},
    estado: { type: String, enum: ['Registrado','Pendiente','Anulado'], default:'Pendiente', required: true }, 
    total: { type: Number, required: true },
    proveedor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proveedor',
      required: true
    },
    igv: {
        type: Number,
        required: true
    }
});

// Middleware para asignar automáticamente la serie y el nroComprobante
compraSchema.pre('save', async function (next) {
    if (!this.serie) {
        this.serie = this.tipoComprobante === 'FACTURA DE COMPRA ELECTRONICA' ? 'F01' : 'B01';
    }

    if (!this.nroComprobante) { 
        const lastCompra = await mongoose.model('Compra').findOne({ serie: this.serie }).sort({ nroComprobante: -1 });
        if (lastCompra && lastCompra.nroComprobante) {
            // Convertimos el número de comprobante anterior a número y le sumamos 1
            const lastNro = parseInt(lastCompra.nroComprobante, 10);
            this.nroComprobante = String(lastNro + 1).padStart(3, '0'); 
        } else {
            this.nroComprobante = '001'; // Si no hay compras previas, inicia en '001'
        }
    }
    next();
});

const Compra = mongoose.model('Compra', compraSchema);
module.exports = Compra;