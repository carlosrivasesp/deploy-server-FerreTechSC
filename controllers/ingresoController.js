const ingreso = require('../models/ingreso');

exports.obtenerIngresos = async (req, res) => {
    try {
        const ingresos = await ingreso.find().populate('ventaId').populate('compraId');
        res.json(ingresos);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener los ingresos' });
    }
};

exports.obtenerIngreso = async (req, res) => {
    try {
        const ingreso = await ingreso.findById(req.params.id).populate({
            path: 'ventaId',
            populate: {
              path: 'detalles', // Esto es clave
              model: 'DetalleVenta', // Asegúrate de que coincida con tu modelo real
            }
          }).populate({path: 'compraId', populate: {path:'detalleC', model:'DetalleCompra'}});

        if (!ingreso) {
            return res.status(404).json({ msg: 'Ingreso no encontrado' });
        }

        res.json(ingreso);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener el ingreso' });
    }
};