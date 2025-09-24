const DetalleVenta = require('../models/detalleVenta');

exports.obtenerDetallesVenta = async (req, res) => {
    try {
        const detalles = await DetalleVenta.find().populate('producto');
        res.json(detalles);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener detalles de ventas', error });
    }
};
