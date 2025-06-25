const mongoose = require('mongoose');

const ventaSchema = new mongoose.Schema({
    fechaEmision: { type: Date, default: Date.now },
    fechaVenc: { type: Date, default: Date.now },
    tipoComprobante: { 
        type: String, 
        enum: ['FACTURA DE VENTA ELECTRONICA', 'BOLETA DE VENTA ELECTRONICA'], 
        required: true 
    }, 
    nroComprobante: { type: String },  // Se generará automáticamente
    serie: { type: String }, // Se asignará automáticamente en el middleware
    detalles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DetalleVenta' }], 
    moneda: { type: String, default: 'S/', enum: ['S/'] }, 
    tipoCambio: { type: Number, default: 3.66 }, 
    // tipoPago: { type: String, enum: ['Directo', 'Cuotas'], required: true },
    metodoPago:{type:String,enum:['Transferencia', 'Efectivo', 'Tarjeta de credito', 'Tarjeta de debito', 'Yape', 'Plin'], required:true},
    lugar: { type: mongoose.Schema.Types.ObjectId, ref: 'LugaresEntrega'},
    estado: { type: String, enum: ['Registrado','Pendiente','Anulado','Devolución'], default:'Pendiente', required: true }, 
    igv: { type: Number, required: true },
    total: { type: Number, required: true },
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: true
    },
});

// Middleware para asignar automáticamente la serie y el nroComprobante
ventaSchema.pre('save', async function (next) {
    if (!this.serie) {
        this.serie = this.tipoComprobante === 'FACTURA DE VENTA ELECTRONICA' ? 'F01' : 'B01';
    }

    if (!this.nroComprobante) { 
        const lastVenta = await mongoose.model('Venta').findOne({ serie: this.serie }).sort({ nroComprobante: -1 });
        if (lastVenta && lastVenta.nroComprobante) {
            // Convertimos el número de comprobante anterior a número y le sumamos 1
            const lastNro = parseInt(lastVenta.nroComprobante, 10);
            this.nroComprobante = String(lastNro + 1).padStart(3, '0'); 
        } else {
            this.nroComprobante = '001'; // Si no hay ventas previas, inicia en '001'
        }
    }
    next();
});

const Venta = mongoose.model('Venta', ventaSchema);
module.exports = Venta;