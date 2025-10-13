const Compra = require("../models/compra");
const DetalleCompra = require("../models/detallecompra");
const Producto = require("../models/producto");
const ingreso = require("../models/ingreso");
const mongoose = require("mongoose");
const ExcelJS = require('exceljs');

exports.registrarCompra = async (req, res) => {
  try {
    const { detalleC: productos, tipoComprobante, metodoPago, proveedor } = req.body;

    if (
      ![
        "FACTURA DE COMPRA ELECTRONICA",
        "BOLETA DE COMPRA ELECTRONICA",
      ].includes(tipoComprobante)
    ) {
      return res.status(400).json({ mensaje: "Tipo de comprobante inválido." });
    }

    if (
      ![
        "Transferencia",
        "Efectivo",
        "Tarjeta de credito",
        "Tarjeta de debito",
        "Yape",
        "Plin",
      ].includes(metodoPago)
    ) {
      return res.status(400).json({ mensaje: "Método de pago inválido." });
    }

    if (!mongoose.Types.ObjectId.isValid(proveedor)) {
      return res
        .status(400)
        .json({ mensaje: "proveedor no es un ObjectId válido." });
    }

    const proveedorExiste = await mongoose
      .model("Proveedor")
      .findById(proveedor);
    if (!proveedorExiste) {
      return res.status(404).json({ mensaje: "El proveedor no existe." });
    }

    let subtotalCompra = 0;
    let productosProcesados = [];

    for (let item of productos) {
      const producto = await Producto.findOne({ nombre: item.nombre });
      if (!producto) {
        return res
          .status(404)
          .json({ mensaje: `Producto ${item.nombre} no encontrado.` });
      }

      productosProcesados.push({ producto, cantidad: item.cantidad });
      subtotalCompra += item.cantidad * producto.precio;
    }

    // ✅ Calcular IGV y total fuera del bucle
    const igvCompra = +(subtotalCompra * 0.18).toFixed(2);
    const totalCompra = +(subtotalCompra + igvCompra).toFixed(2);

    const nuevaCompra = new Compra({
      tipoComprobante,
      metodoPago,
      estado: "Pendiente",
      detalles: [],
      total: 0,
      igv: 0,
      proveedor: new mongoose.Types.ObjectId(proveedor),
    });

    await nuevaCompra.save();

    let detallesCompra = [];
    for (let { producto, cantidad } of productosProcesados) {
      const subtotal = cantidad * producto.precio;

      const detalle = new DetalleCompra({
        compra: nuevaCompra._id,
        producto: producto._id,
        codInt: producto.codInt,
        nombre: producto.nombre,
        cantidad,
        precio: producto.precio,
        subtotal,
      });

      await detalle.save();
      detallesCompra.push(detalle._id);
    }

    nuevaCompra.detalleC = detallesCompra;
    nuevaCompra.igv = igvCompra;
    nuevaCompra.total = totalCompra;
    await nuevaCompra.save();

    const compraConProveedor = await Compra.findById(nuevaCompra._id)
      .populate("proveedor", "nombre tipoDoc nroDoc telefono correo")
      .populate("detalleC");

    const detallesFormateados = compraConProveedor.detalleC.map((det) => ({
      producto: {
        codInt: det.codInt,
        nombre: det.nombre,
        precio: det.precio,
      },
      cantidad: det.cantidad,
      subtotal: det.subtotal,
    }));

    res.json({
      mensaje: "Compra registrada",
      compra: {
        _id: compraConProveedor._id,
        tipoComprobante: compraConProveedor.tipoComprobante,
        nroComprobante: compraConProveedor.nroComprobante,
        metodoPago: compraConProveedor.metodoPago,
        estado: compraConProveedor.estado,
        igv: compraConProveedor.igv,
        total: compraConProveedor.total,
        proveedor: compraConProveedor.proveedor,
        detalles: detallesFormateados,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Obtener todas las compras
exports.obtenerCompras = async (req, res) => {
  try {
    const compras = await Compra.find()
      .populate("detalleC")
      .populate("proveedor", "nombre tipoDoc nroDoc telefono correo");

    res.json(compras);
  } catch (error) {
    console.error("Error al obtener compras:", error);
    res
      .status(500)
      .json({ mensaje: "Error al obtener compras", error: error.message });
  }
};

// Obtener una compra específica
exports.obtenerCompra = async (req, res) => {
  try {
    const compra = await Compra.findById(req.params.id)
      .populate("detalleC")
      .populate("proveedor", "nombre tipoDoc nroDoc telefono correo");

    if (!compra) {
      return res.status(404).json({ mensaje: "No existe el comprobante" });
    }

    res.json(compra);
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: "Error al obtener la compra", error });
  }
};

exports.actualizarCompra = async (req, res) => {
  try {
    const { estado, metodoPago } = req.body;
    const compra = await Compra.findById(req.params.id);
    if (!compra) {
      return res.status(404).json({ mensaje: "Compra no encontrada" });
    }

    const estadoAnterior = compra.estado;
    compra.estado = estado || compra.estado;
    compra.metodoPago = metodoPago || compra.metodoPago;

    if (estado === "Registrado" && estadoAnterior === "Pendiente") {
      let cantidadTotal = 0;
    
      for (let detalleId of compra.detalleC) {
        let detalleC = await DetalleCompra.findById(detalleId).populate("producto");
    
        if (!detalleC || !detalleC.producto) {
          return res.status(400).json({
            mensaje: "Detalle o producto no encontrado para la compra.",
          });
        }
    
        let producto = detalleC.producto;
        producto.stockActual += detalleC.cantidad;
        await producto.save();
    
        cantidadTotal += detalleC.cantidad;
      }
    
      // Crear un único registro en ingreso
      const ingreso = new ingreso({
        tipoOperacion: "Compra Registrada",
        compraId: compra._id,
        cantidadTotal,
        fechaIngreso: new Date()
      });
    
      await ingreso.save();
    } else {
      console.log("Nada");
    }
    
    await compra.save();

    const ingresos = await ingreso.find({ compraId: compra._id });

    res.json({
      mensaje: "Compra actualizada correctamente",
      compra,
      ingresos,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: "Error al actualizar la compra", error });
  }
};
const exportarCompras = async (compras, res, nombreArchivo) => { // Cambiar parámetro a 'compras'
    try {
        if (compras.length === 0) {
            return res.status(400).json({ message: 'No hay compras para exportar.' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Compras');

        // Columnas corregidas (eliminar duplicados y ajustar a modelo real)
        worksheet.columns = [
            { header: 'Fecha Emision', key: 'fechaEmision', width: 15 },
            { header: 'Tipo Comprobante', key: 'tipoComprobante', width: 25 },
            { header: 'Nro Comprobante', key: 'nroComprobante', width: 15 },
            { header: 'Serie', key: 'serie', width: 10 },
            { header: 'Moneda', key: 'moneda', width: 10 },
            { header: 'Metodo de Pago', key: 'metodoPago', width: 20 },
            { header: 'Estado', key: 'estado', width: 15 },
            { header: 'Total', key: 'total', width: 15 },
            { header: 'Proveedor', key: 'proveedor', width: 30 },
            { header: 'IGV', key: 'igv', width: 15 }
        ];

        compras.forEach(compra => {
            const fila = {
                fechaEmision: compra.fechaEmision.toLocaleDateString(),
                tipoComprobante: compra.tipoComprobante,
                nroComprobante: compra.nroComprobante,
                serie: compra.serie,
                moneda: compra.moneda,
                metodoPago: compra.metodoPago,
                estado: compra.estado,
                total: compra.total,
                proveedor: compra.proveedor.nombre, // Extraer solo el nombre
                igv: compra.igv
            };
            worksheet.addRow(fila);
        });

        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}.xlsx"`);
        res.send(buffer); // Usar send() en lugar de end()

    } catch (error) {
        console.error('Error al generar el archivo Excel:', error);
        return res.status(500).json({ 
            message: 'Hubo un error al generar el archivo',
            error: error.message
        });
    }
};

// Exportar todas las compras (Listado general)
exports.exportListadoGeneral = async (req, res) => {
    try {
        const compras = await Compra.find()
            .populate('proveedor', 'nombre'); // Asegurar población del nombre
        await exportarCompras(compras, res, 'compras_listado_general');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al exportar listado general');
    }
};
// Exportar facturas
exports.exportFacturas = async (req, res) => {
    try {
        const compras = await Compra.find({ tipoComprobante: 'FACTURA DE COMPRA ELECTRONICA' })
            .populate('proveedor', 'nombre');
        await exportarCompras(compras, res, 'compras_facturas');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al exportar facturas');
    }
};
// Exportar boletas
exports.exportBoletas = async (req, res) => {
    try {
        const compras = await Compra.find({ tipoComprobante: 'BOLETA DE COMPRA ELECTRONICA' })
            .populate('proveedor', 'nombre');
        await exportarCompras(compras, res, 'compras_boletas');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al exportar boletas');
    }
};
// Exportar por proveedor
exports.exportByProveedor = async (req, res) => {
    try {
        const { idProveedor } = req.params;
        const compras = await Compra.find()
            .populate('proveedor', 'nombre');
        await exportarCompras(compras, res, `compras_proveedor_`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al exportar por proveedor');
    }
};