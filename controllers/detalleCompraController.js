const DetalleCompra = require('../models/detallecompra');

exports.obtenerDetallesCompra = async (req, res) => {
    try {
        const detalles = await DetalleCompra.find();
        res.json(detalles);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener detalles de compras', error });
    }
};
