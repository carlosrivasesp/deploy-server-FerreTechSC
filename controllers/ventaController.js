const Venta = require("../models/venta");
const DetalleVenta = require("../models/detalleventa");
const Producto = require("../models/producto");
const Salida = require("../models/salidaProducto");
const Lugar = require("../models/lugaresEntrega");
const mongoose = require("mongoose");
const ingresoProducto = require("../models/ingresoProducto");
const ExcelJS = require("exceljs");

const sugerirCompraSiEsNecesario = require("../utils/sugerirCompra");
const devolucionProducto = require("../models/devolucionProducto");
const Entrega = require("../models/entregas");
const lugaresEntrega = require("../models/lugaresEntrega");

exports.registrarVenta = async (req, res) => {
  try {
    const {
      detalles: productos,
      tipoComprobante,
      metodoPago,
      cliente,
      servicioDelivery 
    } = req.body;

    // Validaciones básicas
    if (!productos || !Array.isArray(productos)) {
      return res
        .status(400)
        .json({
          mensaje: "El campo 'productos' es requerido y debe ser un array.",
        });
    }

    if (
      !["FACTURA DE VENTA ELECTRONICA", "BOLETA DE VENTA ELECTRONICA"].includes(
        tipoComprobante
      )
    ) {
      return res.status(400).json({ mensaje: "Tipo de comprobante inválido." });
    }

    if (
      ![
        "Transferencia", "Efectivo", "Tarjeta de credito",
        "Tarjeta de debito", "Yape", "Plin",
      ].includes(metodoPago)
    ) {
      return res.status(400).json({ mensaje: "Método de pago inválido." });
    }

    if (!mongoose.Types.ObjectId.isValid(cliente)) {
      return res
        .status(400)
        .json({ mensaje: "clienteId no es un ObjectId válido." });
    }

    const clienteExiste = await mongoose.model("Cliente").findById(cliente);
    if (!clienteExiste) {
      return res.status(404).json({ mensaje: "El cliente no existe." });
    }

    // Validar productos y calcular subtotal
    let subtotal = 0;
    let productosProcesados = [];

    for (let item of productos) {
      const producto = await Producto.findOne({ nombre: item.nombre });
      if (!producto) {
        return res
          .status(404)
          .json({ mensaje: `Producto ${item.nombre} no encontrado.` });
      }

      if (producto.stockActual < item.cantidad) {
        return res.status(400).json({
          mensaje: `Stock insuficiente para ${item.nombre}`,
          stockActual: producto.stockActual,
          solicitado: item.cantidad,
        });
      }

      productosProcesados.push({ producto, cantidad: item.cantidad });
      subtotal += item.cantidad * producto.precio;
    }

    // Crear la venta
    const nuevaVenta = new Venta({
      tipoComprobante,
      metodoPago,
      estado: "Pendiente",
      detalles: [],
      igv: 0,
      total: 0,
      cliente: new mongoose.Types.ObjectId(cliente),
      servicioDelivery: servicioDelivery ?? false
    });

    // Calcular IGV y total
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    await nuevaVenta.save();

    // Crear detalles
    let detallesVenta = [];
    for (let { producto, cantidad } of productosProcesados) {
      const subtotal = cantidad * producto.precio;

      const detalle = new DetalleVenta({
        venta: nuevaVenta._id,
        producto: producto._id,
        codInt: producto.codInt,
        nombre: producto.nombre,
        cantidad,
        precio: producto.precio,
        subtotal,
      });

      await detalle.save();
      detallesVenta.push(detalle._id);
    }

    nuevaVenta.detalles = detallesVenta;
    nuevaVenta.igv = igv;
    nuevaVenta.total = total;

    await nuevaVenta.save();
    res.json(nuevaVenta);

    if (servicioDelivery) {
      const entrega = new Entregas({
        ventaId: nuevaVenta._id
      });
      await entrega.save();
    }

  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// Obtener todas las ventas
exports.obtenerVentas = async (req, res) => {
  try {
    const ventas = await Venta.find()
      .populate("detalles")
      .populate("cliente", "nombre tipoDoc nroDoc telefono correo")
    res.json(ventas);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res
      .status(500)
      .json({ mensaje: "Error al obtener ventas", error: error.message });
  }
};

// 1. Función auxiliar primero (exportarFacturas)
const exportarFacturas = async (ventas, res, nombreArchivo) => {
  try {
    if (ventas.length === 0) {
      return res
        .status(400)
        .json({ message: "No hay facturas para exportar." });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Facturas");

    worksheet.columns = [
      { header: "Tipo Comprobante", key: "tipoComprobante", width: 30 },
      { header: "Serie", key: "serie", width: 10 },
      { header: "N° Comprobante", key: "nroComprobante", width: 15 },
      { header: "Cliente", key: "cliente", width: 30 },
      { header: "Fecha Emisión", key: "fechaEmision", width: 20 },
      { header: "Total (S/)", key: "total", width: 15 },
      { header: "Método de Pago", key: "metodoPago", width: 20 },
      { header: "Estado", key: "estado", width: 15 },
    ];

    ventas.forEach((venta) => {
      worksheet.addRow({
        tipoComprobante: venta.tipoComprobante,
        serie: venta.serie,
        nroComprobante: venta.nroComprobante,
        cliente: venta.cliente?.nombre || "Sin cliente",
        fechaEmision: new Date(venta.fechaEmision).toLocaleDateString("es-PE"),
        total: venta.total,
        metodoPago: venta.metodoPago,
        estado: venta.estado,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nombreArchivo}.xlsx"`
    );
    res.end(buffer);
  } catch (error) {
    console.error("Error al exportar facturas:", error);
    res
      .status(500)
      .json({ message: "Error al generar el archivo de facturas." });
  }
};

exports.exportFacturas = async (req, res) => {
  try {
    const ventas = await Venta.find({
      tipoComprobante: "FACTURA DE VENTA ELECTRONICA",
    })
      .populate("cliente", "nombre")
      .sort({ createdAt: -1 });

    await exportarFacturas(ventas, res, "facturas_exportadas");
  } catch (error) {
    console.error("Error al exportar facturas:", error);
    res
      .status(500)
      .json({ message: "No se pudieron exportar las facturas.", error });
  }
};

const exportarVentasPorTipo = async (tipoComprobante, res, nombreArchivo) => {
  try {
    const ventas = await Venta.find({ tipoComprobante })
      .populate("cliente", "nombre")
      .sort({ createdAt: -1 });

    await exportarFacturas(ventas, res, nombreArchivo);
  } catch (error) {
    console.error(`Error al exportar ${tipoComprobante}:`, error);
    res
      .status(500)
      .json({ message: `No se pudo exportar ${tipoComprobante}.`, error });
  }
};

exports.exportBoletas = (req, res) =>
  exportarVentasPorTipo(
    "BOLETA DE VENTA ELECTRONICA",
    res,
    "boletas_exportadas"
  );

exports.exportEfectivo = async (req, res) => {
  try {
    const ventas = await Venta.find({ metodoPago: "Efectivo" })
      .populate("cliente", "nombre")
      .sort({ createdAt: -1 });

    await exportarFacturas(ventas, res, "ventas_efectivo");
  } catch (error) {
    console.error("Error al exportar ventas en efectivo:", error);
    res
      .status(500)
      .json({
        message: "No se pudieron exportar las ventas en efectivo.",
        error,
      });
  }
};

exports.exportOtros = async (req, res) => {
  try {
    const ventas = await Venta.find({ metodoPago: { $ne: "Efectivo" } })
      .populate("cliente", "nombre")
      .sort({ createdAt: -1 });

    await exportarFacturas(ventas, res, "ventas_otros");
  } catch (error) {
    console.error("Error al exportar ventas con otros métodos de pago:", error);
    res
      .status(500)
      .json({
        message: "No se pudieron exportar las ventas con otros métodos.",
        error,
      });
  }
};

exports.exportVentasGeneral = async (req, res) => {
  try {
    const ventas = await Venta.find()
      .populate("cliente", "nombre")
      .sort({ createdAt: -1 });

    await exportarFacturas(ventas, res, "ventas_generales");
  } catch (error) {
    console.error("Error al exportar ventas generales:", error);
    res
      .status(500)
      .json({ message: "No se pudo exportar el listado general.", error });
  }
};

// Obtener una venta específica
exports.obtenerVenta = async (req, res) => {
  try {
    const venta = await Venta.findById(req.params.id)
      .populate("detalles")
      .populate("cliente", "nombre tipoDoc nroDoc telefono correo")

    if (!venta) {
      return res.status(404).json({ mensaje: "No existe el comprobante" });
    }

    res.json(venta);
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: "Error al obtener la venta", error });
  }
};

exports.actualizarVenta = async (req, res) => {
  try {
    const { estado, metodoPago } = req.body;
    const venta = await Venta.findById(req.params.id);
    if (!venta) {
      return res.status(404).json({ mensaje: "Venta no encontrada" });
    }
    const estadoAnterior = venta.estado;
    venta.estado = estado || venta.estado;
    venta.metodoPago = metodoPago || venta.metodoPago;

    if (estado === "Registrado" && estadoAnterior !== "Registrado") {
      let cantidadTotal = 0;

      for (let detalleId of venta.detalles) {
        let detalle = await DetalleVenta.findById(detalleId).populate(
          "producto"
        );

        if (!detalle || !detalle.producto) {
          return res.status(400).json({
            mensaje: "Detalle o producto no encontrado para la venta.",
          });
        }

        let producto = detalle.producto;

        producto.stockActual -= detalle.cantidad;
        await producto.save();
        await sugerirCompraSiEsNecesario(producto._id);

        cantidadTotal += detalle.cantidad;
      }

      // Crear un solo ingreso con los datos de la venta (ya obtenida)
      const salida = new Salida({
        tipoOperacion: "Venta Registrada",
        ventaId: venta._id,
        cantidadTotal,
        fechaSalida: new Date(),
      });

      await salida.save();
    } else if (estado === "Anulado" && estadoAnterior === "Registrado") {
      let cantidadTotal = 0;

      for (let detalleId of venta.detalles) {
        let detalle = await DetalleVenta.findById(detalleId).populate(
          "producto"
        );

        if (!detalle || !detalle.producto) {
          return res.status(400).json({
            mensaje: "Detalle o producto no encontrado para la venta.",
          });
        }

        let producto = detalle.producto;

        producto.stockActual += detalle.cantidad;
        await producto.save();
        await sugerirCompraSiEsNecesario(producto);

        cantidadTotal += detalle.cantidad;
      }

      // Crear un solo ingreso con los datos de la venta (ya obtenida)
      const ingreso = new ingresoProducto({
        tipoOperacion: "Venta Anulada",
        ventaId: venta._id,
        cantidadTotal,
        fechaIngreso: new Date(),
      });

      await ingreso.save();
    } else if (estado === "Devolución" && estadoAnterior === "Registrado") {
      let cantidadTotal = 0;

      for (let detalleId of venta.detalles) {
        let detalle = await DetalleVenta.findById(detalleId).populate(
          "producto"
        );

        if (!detalle || !detalle.producto) {
          return res.status(400).json({
            mensaje: "Detalle o producto no encontrado para la venta.",
          });
        }

        let producto = detalle.producto;

        producto.stockActual += detalle.cantidad;
        await producto.save();
        await sugerirCompraSiEsNecesario(producto);

        cantidadTotal += detalle.cantidad;
      }

      // Crear una sola devolucion con los datos de la venta (ya obtenida)
      const devolucion = new devolucionProducto({
        ventaId: venta._id,
        cantidadTotal,
        fechaDevolucion: new Date(),
      });

      await devolucion.save();
    }

    await venta.save();

    const salidas = await await Salida.find({ ventaId: venta._id });

    res.json({
      mensaje: "Venta actualizada correctamente",
      venta,
      salidas,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: "Error al actualizar la venta", error });
  }
};
