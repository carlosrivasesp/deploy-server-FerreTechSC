const DetalleCotizacion = require('../models/detallecotizacion');  // Modelo de DetalleCotizacion

// Obtener todos los detalles de las cotizaciones
exports.obtenerDetallesCotizacion = async (req, res) => {
  try {
    const detalles = await DetalleCotizacion.find()
      .populate("producto", "nombre precio");  // Poblar los detalles con la información del producto

    res.json(detalles);  // Devuelve los detalles de cotizaciones
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener detalles de cotización", error });
  }
};
