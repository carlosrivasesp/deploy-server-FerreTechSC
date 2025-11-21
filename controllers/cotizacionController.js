const DetalleCotizacion = require('../models/detallecotizacion');
const Producto = require('../models/producto');
const Venta = require('../models/venta');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const Cotizacion = require('../models/cotizacion');
const Operacion = require('../models/operacion');
const DetalleOperacion = require("../models/detalleOperacion");

exports.registrarCotizacion = async (req, res) => {
  try {
    const { cliente, detalleC } = req.body;

    // Verifica si el cliente existe en la base de datos
    const clienteExistente = await mongoose.model("Cliente").findById(cliente);
    if (!clienteExistente) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    let subtotalCotizacion = 0;
    let productosProcesados = [];
    let detallesCotizacion = [];  // Debes declarar esto antes de usarlo

    // Procesar los productos de la cotización
    for (let item of detalleC) {
      const producto = await Producto.findOne({ nombre: item.nombre });
      if (!producto) {
        return res.status(404).json({ mensaje: `Producto ${item.nombre} no encontrado.` });
      }

      productosProcesados.push({ producto, cantidad: item.cantidad });
      subtotalCotizacion += item.cantidad * producto.precio;
    }

    // Calcular total
    const igv = +(subtotalCotizacion * 0.18).toFixed(2);
    const totalCotizacion = +(subtotalCotizacion + igv).toFixed(2);


    // Crear nueva cotización
    const nuevaCotizacion = new Cotizacion({
      cliente: clienteExistente._id,
      contacto: clienteExistente.nombre, // Usar el nombre del cliente
      telefono: clienteExistente.telefono,
      moneda: "S/",
      tipoCambio: 3.66,
      tiempoValidez: 15,  // Valor predeterminado
      estado: "Pendiente", // Estado de la cotización
      igv: igv,
      total: totalCotizacion,
      detalleC: detallesCotizacion  // Detalles de la cotización, que se agregarán después
    });

    await nuevaCotizacion.save();

    // Crear detalles de la cotización
    for (let { producto, cantidad } of productosProcesados) {
      const subtotal = cantidad * producto.precio;

      const detalle = new DetalleCotizacion({
        cotizacion: nuevaCotizacion._id,
        producto: producto._id,
        nombre: producto.nombre,
        cantidad,
        precio: producto.precio,
        subtotal,
      });

      await detalle.save();
      detallesCotizacion.push(detalle._id);

      
    }

    // Actualizar cotización con los detalles
    nuevaCotizacion.detalleC = detallesCotizacion;
    await nuevaCotizacion.save();

    res.json({
      mensaje: "Cotización registrada",
      cotizacion: nuevaCotizacion,
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al registrar cotización", error });
  }
};

exports.obtenerDetallesCotizacion = async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id)
      .populate({
        path: 'detalleC',  // Poblar detalles de la cotización
        populate: { path: 'producto', model: 'Producto' },  // Poblar los productos dentro de los detalles
      });

    if (!cotizacion) {
      return res.status(404).json({ mensaje: 'Cotización no encontrada' });
    }

    console.log(cotizacion);  // Verifica los datos de la cotización
    res.json(cotizacion);  // Enviar la cotización con los detalles
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener los detalles de la cotización', error });
  }
};

exports.obtenerCotizaciones = async (req, res) => {
  try {
    const cotizaciones = await Cotizacion.find()
      .populate("detalleC")  // Poblar los detalles de cada cotización
      .populate("cliente", "nombre tipoDoc nroDoc telefono correo");  // Poblar el cliente de la cotización
    res.json(cotizaciones);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener cotizaciones", error });
  }
};

// Obtener una cotización específica
exports.obtenerCotizacion = async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id)
      .populate("detalleC")
      .populate("cliente", "nombre tipoDoc nroDoc telefono correo");

    if (!cotizacion) {
      return res.status(404).json({ mensaje: "Cotización no encontrada" });
    }

    res.json(cotizacion);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener cotización", error });
  }
};

exports.obtenerDetallesCotizacionPorVenta = async (req, res) => {
  try {
    const ventaId = req.params.id;

    // Buscar la venta por id
    const venta = await Venta.findById(ventaId);

    if (!venta) return res.status(404).json({ mensaje: 'Venta no encontrada' });

    // Buscar cotización que tenga cliente y total igual a la venta y estado Confirmada
    const cotizacion = await Cotizacion.findOne({
      cliente: venta.cliente,
      total: venta.total,
      estado: 'Confirmada',
    });

    if (!cotizacion) {
      return res.json({ detalles: [] }); // No hay cotización asociada
    }

    // Obtener detalles de la cotización
    const detalles = await DetalleCotizacion.find({ cotizacion: cotizacion._id })
      .populate('producto', 'nombre precio');

    res.json({ detalles });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener detalles de cotización', error });
  }
};

exports.actualizarCotizacion = async (req, res) => {
  try {
    const { estado, tipoComprobante, serie, metodoPago , servicioDelivery} = req.body;

    const cotizacion = await Cotizacion.findById(req.params.id)
      .populate("cliente")
      .populate({
        path: "detalleC",
        populate: { path: "producto" }
      });

    if (!cotizacion) {
      return res.status(404).json({ mensaje: "Cotización no encontrada" });
    }

    // Actualizar estado
    cotizacion.estado = estado || cotizacion.estado;
    await cotizacion.save();


    //---------------------------------------------
    // SI LA COTIZACIÓN FUE CONFIRMADA
    //---------------------------------------------
    if (estado === "Confirmada") {

      //----------------------------------------------------------
      // 1️⃣ CREAR VENTA
      //----------------------------------------------------------
      const nuevaVenta = new Venta({
        tipoComprobante,
        serie,
        cliente: cotizacion.cliente._id,
        fechaEmision: cotizacion.fechaEmision || new Date(),
        metodoPago,
        igv: cotizacion.igv,
        total: cotizacion.total,
        estado: "Pendiente"
      });

      await nuevaVenta.save();

      //----------------------------------------------------------
      // 2️⃣ GENERAR nroOperacion (pedido)
      //----------------------------------------------------------
      const lastPedido = await Operacion.findOne({ tipoOperacion: 1 })
        .sort({ nroOperacion: -1 });

      let nroOperacion = "001";
      if (lastPedido && lastPedido.nroOperacion) {
        nroOperacion = String(parseInt(lastPedido.nroOperacion) + 1).padStart(3, "0");
      }

      //----------------------------------------------------------
      // 3️⃣ GENERAR código único del pedido
      //----------------------------------------------------------
      const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let codigo, existeCod = true;

      while (existeCod) {
        codigo = Array.from({ length: 6 },
          () => caracteres[Math.floor(Math.random() * caracteres.length)]
        ).join("");

        existeCod = await Operacion.findOne({ codigo });
      }

      //----------------------------------------------------------
      // 4️⃣ CALCULAR SUBTOTALES
      //----------------------------------------------------------
      let subtotal = 0;
      const detallesIds = [];

      for (const d of cotizacion.detalleC) {
        subtotal += d.cantidad * d.precio;
      }

      const igvCalc = subtotal * 0.18;
      const totalCalc = subtotal + igvCalc;

      //----------------------------------------------------------
      // 5️⃣ CREAR PEDIDO (OPERACION)
      //----------------------------------------------------------
      const nuevoPedido = new Operacion({
        nroOperacion,
        tipoOperacion: 1, // Pedido
        fechaEmision: Date.now(),
        fechaVenc: Date.now(),
        estado: "Pendiente",
        servicioDelivery: servicioDelivery,
        cliente: cotizacion.cliente._id,
        igv: igvCalc.toFixed(2),
        total: totalCalc.toFixed(2),
        codigo,
        detalles: []
      });

      await nuevoPedido.save();

      //----------------------------------------------------------
      // 6️⃣ CREAR DETALLES DE OPERACIÓN
      //----------------------------------------------------------
      for (const d of cotizacion.detalleC) {
        const detalle = new DetalleOperacion({
          operacion: nuevoPedido._id,
          producto: d.producto._id,
          nombre: d.producto.nombre,
          codInt: d.producto.codInt,
          cantidad: d.cantidad,
          precio: d.precio,
          subtotal: d.cantidad * d.precio
        });

        await detalle.save();
        detallesIds.push(detalle._id);
      }

      nuevoPedido.detalles = detallesIds;
      await nuevoPedido.save();
    }

    res.json({ mensaje: "Cotización actualizada", cotizacion });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al actualizar cotización", error });
  }
};


const exportarCotizaciones = async (cotizaciones, res, nombreArchivo) => {
  try {
    if (cotizaciones.length === 0) {
      return res.status(400).json({ message: "No hay cotizaciones para exportar." });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Cotizaciones");

    worksheet.columns = [
      { header: "N° Cotización", key: "nroCotizacion", width: 15 },
      { header: "Fecha Emisión", key: "fechaEmision", width: 20 },
      { header: "Fecha Vencimiento", key: "fechaVenc", width: 20 },
      { header: "Cliente", key: "cliente", width: 25 },
      { header: "Contacto", key: "contacto", width: 20 },
      { header: "Teléfono", key: "telefono", width: 15 },
      { header: "Moneda", key: "moneda", width: 10 },
      { header: "Tipo Cambio", key: "tipoCambio", width: 12 },
      { header: "Validez (días)", key: "tiempoValidez", width: 15 },
      { header: "Total", key: "total", width: 10 },
      { header: "Estado", key: "estado", width: 15 }
    ];

    cotizaciones.forEach((cotizacion) => {
      worksheet.addRow({
        nroCotizacion: cotizacion.nroCotizacion,
        fechaEmision: cotizacion.fechaEmision ? new Date(cotizacion.fechaEmision).toLocaleDateString() : '',
        fechaVenc: cotizacion.fechaVenc ? new Date(cotizacion.fechaVenc).toLocaleDateString() : '',
        cliente: cotizacion.cliente?.nombre || 'Sin nombre',
        contacto: cotizacion.contacto,
        telefono: cotizacion.telefono,
        moneda: cotizacion.moneda,
        tipoCambio: cotizacion.tipoCambio,
        tiempoValidez: cotizacion.tiempoValidez,
        total: cotizacion.total,
        estado: cotizacion.estado
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${nombreArchivo}.xlsx"`);
    res.end(buffer);
  } catch (error) {
    console.error("Error al exportar cotizaciones:", error);
    res.status(500).json({ message: "Error al generar el archivo Excel." });
  }
};

// Funciones específicas
exports.exportCotizacionesEmitidas = async (req, res) => {
  const cotizaciones = await Cotizacion.find().populate('cliente');
  await exportarCotizaciones(cotizaciones, res, 'cotizaciones_emitidas');
};

exports.exportCotizacionesPendientes = async (req, res) => {
  const cotizaciones = await Cotizacion.find({ estado: 'Pendiente' }).populate('cliente');
  await exportarCotizaciones(cotizaciones, res, 'cotizaciones_pendientes');
};

exports.exportCotizacionesAceptadas = async (req, res) => {
  const cotizaciones = await Cotizacion.find({ estado: 'Confirmada' }).populate('cliente');
  await exportarCotizaciones(cotizaciones, res, 'cotizaciones_aceptadas');
};

exports.exportCotizacionesRechazadas = async (req, res) => {
  const cotizaciones = await Cotizacion.find({ estado: 'Anulada' }).populate('cliente');
  await exportarCotizaciones(cotizaciones, res, 'cotizaciones_rechazadas');
};

// Requiere lógica adicional si usas un campo `convertida: true`
exports.exportCotizacionesConvertidas = async (req, res) => {
  const cotizaciones = await Cotizacion.find({ estado: 'Confirmada' }).populate('cliente');
  await exportarCotizaciones(cotizaciones, res, 'cotizaciones_convertidas');
};


