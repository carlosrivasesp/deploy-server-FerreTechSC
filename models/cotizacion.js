const mongoose = require('mongoose');

const cotizacionSchema = new mongoose.Schema({
    nroCotizacion: { type: String },  // Agregar este campo
    fechaEmision: { type: Date, default: Date.now },
    fechaVenc: { type: Date, default: Date.now },
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: true
    },
    contacto: { type: String, required: true },
    telefono: { type: String, required: true },
    moneda: { type: String, default: 'S/', enum: ['S/'], required: true },
    tipoCambio: { type: Number, default: 3.66, required: true },
    tiempoValidez: { type: Number, required: true },  // en días
    detalleC: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DetalleCotizacion' }],
    igv: { type: Number, required: true },
    total: { type: Number, required: true },
    estado: { type: String, enum: ['Pendiente', 'Confirmada', 'Anulada'], default: 'Pendiente', required: true }
  });
  

// Middleware para asignar automáticamente el número de cotización (similar a la compra)
cotizacionSchema.pre('save', async function (next) {
    if (!this.nroCotizacion) { 
        const lastCotizacion = await mongoose.model('Cotizacion').findOne().sort({ nroCotizacion: -1 });
        if (lastCotizacion && lastCotizacion.nroCotizacion) {
            // Convertimos el número de cotización anterior a número y le sumamos 1
            const lastNro = parseInt(lastCotizacion.nroCotizacion, 10);
            this.nroCotizacion = String(lastNro + 1).padStart(3, '0'); 
        } else {
            this.nroCotizacion = '001'; // Si no hay cotizaciones previas, inicia en '001'
        }
    }
    next();
});

const Cotizacion = mongoose.model('Cotizacion', cotizacionSchema, 'cotizaciones');
module.exports = Cotizacion;
