const ExcelJS = require('exceljs');
const LugaresEntrega = require('../models/lugaresEntrega');

exports.createLugar = async (req, res) => {
  try {
    const maxLugar = await LugaresEntrega.findOne().sort('-codigo');
    const nuevoCodigo = maxLugar ? maxLugar.codigo + 1 : 100;

    const nuevoLugar = new LugaresEntrega({
      ...req.body,
      codigo: nuevoCodigo
    });

    await nuevoLugar.save();
    res.status(201).json(nuevoLugar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLugaresEntrega = async (req, res) => {
    try {
      const lugares = await LugaresEntrega.find();
      res.status(200).json(lugares);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};
  
exports.getLugarEntrega = async (req, res) => {
    try {
      let lugar = await LugaresEntrega.findById(req.params.id);
      if (!lugar) {
        res.status(404).json({ message: 'Lugar no encontrado' });
      }
      res.status(200).json(lugar);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};
  
exports.updateLugar = async (req, res) => {
    try {
      const { costo, inicio, fin } = req.body;
      let lugar = await LugaresEntrega.findById(req.params.id);

      if (!lugar) {
        res.status(404).json({ message: 'Lugar no encontrado' });
      }

      lugar.costo = costo;
      lugar.inicio = inicio;
      lugar.fin = fin;

      res.json(lugar);
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

const exportarLugaresEntrega = async (lugares, res, nombreArchivo) => {
    try {
        if (lugares.length === 0) {
            return res.status(400).json({ message: 'No hay lugares para exportar.' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('LugaresEntrega');

        worksheet.columns = [
            { header: 'Código', key: 'codigo', width: 15 },
            { header: 'Distrito', key: 'distrito', width: 25 },
            { header: 'Costo', key: 'costo', width: 10 },
            { header: 'Inicio', key: 'inicio', width: 15 },
            { header: 'Fin', key: 'fin', width: 15 }
        ];

        lugares.forEach(lugar => {
            const fila = {
                codigo: lugar.codigo,
                distrito: lugar.distrito,
                costo: lugar.costo,
                inicio: lugar.inicio,
                fin: lugar.fin,
            };
        
            worksheet.addRow(fila); 
        });

        const buffer = await workbook.xlsx.writeBuffer();

        console.log('Tamaño del buffer generado:', buffer.length);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}.xlsx"`);

        res.end(buffer);
    } catch (error) {
        console.error('Error al generar el archivo Excel:', error);
        return res.status(500).json({ message: 'Hubo un error al generar el archivo.' });
    }
};

exports.exportLugares = async (req, res) => {
    try {
        const lugares = await LugaresEntrega.find();
        await exportarLugaresEntrega(lugares, res, 'lugaresEntrega');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al exportar todos los lugares.');
    }
};