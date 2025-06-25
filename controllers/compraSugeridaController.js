const CompraSugerida = require('../models/compraSugerida');
const Producto = require('../models/producto');
const ExcelJS = require('exceljs');

exports.getComprasSugeridas = async (req, res) => {
  try {
    const sugerencias = await CompraSugerida.find()
      .populate({
        path: 'producto',
        select: 'nombre codInt precio stockActual stockMin categoria marca',
        populate: [
          {
            path: 'categoria',
            select: 'nombre'
          },
          {
            path: 'marca',
            select: 'nombre proveedor',
            populate: {
              path: 'proveedor',
              select: 'nombre'
            }
          }
        ]
      })
      .sort({ fechaSugerencia: -1 }); // Ordena por fecha, recientes primero

    res.json(sugerencias);
  } catch (error) {
    console.error("Error al obtener compras sugeridas:", error);
    res.status(500).json({ mensaje: "Error al obtener compras sugeridas", error: error.message });
  }
};

exports.generarSugerenciasFaltantes = async (req, res) => {
  try {
    const productos = await Producto.find();
    let sugerenciasCreadas = [];

    for (const producto of productos) {
      const stockBajo = producto.stockActual <= producto.stockMin;

      if (stockBajo) {
        const yaExiste = await CompraSugerida.findOne({ producto: producto._id, tieneOrdenCompra: false });
        if (!yaExiste) {
          const nuevaSugerencia = new CompraSugerida({ producto: producto._id });
          await nuevaSugerencia.save();
          sugerenciasCreadas.push(producto.nombre);
        }
      }
    }

    res.json({
      mensaje: "Sugerencias generadas correctamente",
      sugerenciasCreadas,
    });
  } catch (error) {
    console.error("Error al generar sugerencias:", error);
    res.status(500).json({ mensaje: "Error interno del servidor", error: error.message });
  }
};

exports.marcarOrdenGenerada = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('ID recibido:', id);

    const sugerencia = await CompraSugerida.findById(id);
    console.log('Sugerencia encontrada:', sugerencia);

    if (!sugerencia) {
      return res.status(404).json({ message: 'Sugerencia no encontrada' });
    }

    sugerencia.tieneOrdenCompra = true;
    await sugerencia.save();

    res.status(200).json({ message: 'Sugerencia actualizada con éxito' });
  } catch (err) {
    console.error('Error al marcar orden generada:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
exports.exportComprasSugeridas = async (req, res) => {
    try {
        const sugerencias = await CompraSugerida.find()
            .populate('producto', 'nombre');

        if (sugerencias.length === 0) {
            return res.status(400).json({ message: 'No hay sugerencias para exportar.' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Compras Sugeridas');

        // Solo estas tres columnas como solicitaste
        worksheet.columns = [
            { header: 'Producto', key: 'producto', width: 50 },
            { header: 'Tiene Orden Compra', key: 'tieneOrdenCompra', width: 20 },
            { header: 'Fecha Sugerencia', key: 'fechaSugerencia', width: 20 }
        ];

        sugerencias.forEach(sug => {
            const fila = {
                producto: sug.producto?.nombre || 'Compra sugerida no encontrada',
                tieneOrdenCompra: sug.tieneOrdenCompra ? 'Sí' : 'No',
                fechaSugerencia: sug.fechaSugerencia.toLocaleDateString()
            };
            worksheet.addRow(fila);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="compras_sugeridas.xlsx"');
        res.send(buffer); // Cambiar end() por send()

    } catch (error) {
        console.error('Error al exportar compras sugeridas:', error);
        res.status(500).json({ 
            message: 'Hubo un error al generar el archivo',
            error: error.message
        });
    }
};