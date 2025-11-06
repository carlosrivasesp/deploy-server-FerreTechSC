const Operacion = require('../models/operacion');
require('../models/cliente');
const getTrackingByCode = async (req, res) => {
    try {
        const { codigo } = req.params;

        if (!codigo) {
            return res.status(400).json({ 
                success: false, 
                message: 'Se requiere un código de seguimiento.' 
            });
        }

        const operacion = await Operacion.findOne({ codigo: codigo })
                                          .populate('cliente');


        if (!operacion) {
            return res.status(404).json({ 
                success: false, 
                message: 'Código de seguimiento no encontrado.' 
            });
        }

        res.status(200).json({
            success: true,
            data: {
                codigo: operacion.codigo,
                cliente: operacion.cliente ? operacion.cliente.nombre : 'Cliente no encontrado',
                estado: operacion.estado,
                fechaEmision: operacion.fechaEmision
            }
        });

    } catch (error) {
        console.error('Error en getTrackingByCode:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error del servidor al buscar el seguimiento.' 
        });
    }
};

module.exports = {
    getTrackingByCode,
};