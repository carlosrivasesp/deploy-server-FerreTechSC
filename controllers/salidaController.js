const Salida = require('../models/salidaProducto');

exports.obtenerSalidas = async (req, res) => {
    try {
        const salidas = await Salida.find().populate({path:'ventaId', populate: {path: 'detalles', model:'DetalleVenta'}});
        res.json(salidas);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener las salidas' });
    }
};

exports.obtenerSalida = async (req, res) => {
    try {
        const salida = await Salida.findById(req.params.id).populate({
            path: 'ventaId',
            populate: {
              path: 'detalles', // Esto es clave
              model: 'DetalleVenta', // Asegúrate de que coincida con tu modelo real
            }
          });

        if (!salida) {
            return res.status(404).json({ msg: 'Salida no encontrado' });
        }

        res.json(salida);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener la salida' });
    }
};