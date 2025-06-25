const DevolucionProducto = require('../models/devolucionProducto');
const Producto = require('../models/producto');

exports.obtenerDevoluciones = async (req, res) => {
    try {
        const devoluciones = await DevolucionProducto.find()
            .populate('ventaId')
        res.json(devoluciones);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener las devoluciones' });
    }
};

exports.obtenerDevolucion = async (req, res) => {
    try {
        const devolucion = await DevolucionProducto.findById(req.params.id)
            .populate({
                path: 'ventaId',
                populate: {
                    path: 'detalles',
                    model: 'DetalleVenta',
                }
            })

        if (!devolucion) {
            return res.status(404).json({ msg: 'Devolución no encontrada' });
        }

        res.json(devolucion);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener la devolución' });
    }
};
