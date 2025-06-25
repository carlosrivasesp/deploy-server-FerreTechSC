const Venta = require("../models/venta");
const DetalleVenta = require("../models/detalleventa");
const Producto = require("../models/producto");
const Salida = require("../models/salidaProducto");
const Lugar = require("../models/lugaresEntrega");
const mongoose = require("mongoose");
const ingresoProducto = require("../models/ingresoProducto");
const Entregas = require("../models/entregas");
const ExcelJS = require('exceljs');

const sugerirCompraSiEsNecesario = require('../utils/sugerirCompra');
const devolucionProducto = require("../models/devolucionProducto");

exports.registrarVenta = async (req, res) => {
    try {
      const { detalles: productos, tipoComprobante, metodoPago, lugarId, cliente} = req.body;
  
      // Validaciones básicas
      if (!productos || !Array.isArray(productos)) {
        return res.status(400).json({ mensaje: "El campo 'productos' es requerido y debe ser un array." });
      }
  
      if (!["FACTURA DE VENTA ELECTRONICA", "BOLETA DE VENTA ELECTRONICA"].includes(tipoComprobante)) {
        return res.status(400).json({ mensaje: "Tipo de comprobante inválido." });
      }
  
      if (!["Transferencia", "Efectivo", "Tarjeta de credito", "Tarjeta de debito", "Yape", "Plin"].includes(metodoPago)) {
        return res.status(400).json({ mensaje: "Método de pago inválido." });
      }
  
      if (!mongoose.Types.ObjectId.isValid(cliente)) {
        return res.status(400).json({ mensaje: "clienteId no es un ObjectId válido." });
      }
  
      const clienteExiste = await mongoose.model("Cliente").findById(cliente);
      if (!clienteExiste) {
        return res.status(404).json({ mensaje: "El cliente no existe." });
      }
  
      // Validar lugar
      let lugar = null;
      if (lugarId) {
        if (!mongoose.Types.ObjectId.isValid(lugarId)) {
          return res.status(400).json({ mensaje: "Lugar id no es un ObjectID válido." });
        }
  
        lugar = await mongoose.model("LugaresEntrega").findById(lugarId);
        if (!lugar) {
          return res.status(400).json({ mensaje: "El lugar no existe." });
        }
      }
  
      // Validar productos y calcular total
      let totalVenta = lugar ? lugar.costo : 0;
      let productosProcesados = [];
  
      for (let item of productos) {
        const producto = await Producto.findOne({ nombre: item.nombre });
        if (!producto) {
          return res.status(404).json({ mensaje: `Producto ${item.nombre} no encontrado.` });
        }
  
        if (producto.stockActual < item.cantidad) {
          return res.status(400).json({
            mensaje: `Stock insuficiente para ${item.nombre}`,
            stockActual: producto.stockActual,
            solicitado: item.cantidad,
          });
        }
  
        productosProcesados.push({ producto, cantidad: item.cantidad });
        totalVenta += item.cantidad * producto.precio;
      }
  
      // Crear la venta (ahora sí)
      const nuevaVenta = new Venta({
        tipoComprobante,
        metodoPago,
        estado: "Pendiente",
        detalles: [],
        igv:0,
        total: 0,
        cliente: new mongoose.Types.ObjectId(cliente),
        lugar: lugar ? new mongoose.Types.ObjectId(lugarId) : null,
       });
  
      await nuevaVenta.save();

    if (lugar) {
      const entrega = new Entregas({
        ventaId: nuevaVenta._id,
        direccion: 'Pendiente',
        estado: "Pendiente",
        fechaInicio: Date.now(),
        fechaFin: Date.now(),
      })
      await entrega.save();
    }


  
      // Crear detalles y descontar stock
      let detallesVenta = [];
      for (let { producto, cantidad } of productosProcesados) {
        /*
        await Producto.updateOne(
          { _id: producto._id },
          { $inc: { stockActual: -cantidad } }
        );
        */
  
        const subtotal = cantidad * producto.precio;
  
        const detalle = new DetalleVenta({
          venta: nuevaVenta._id,
          producto: producto._id,
          codInt: producto.codInt,
          nombre: producto.nombre,
          cantidad,
          precio: producto.precio,
          codigoL: lugar ? lugar.codigo : "",
          distrito: lugar ? lugar.distrito : "",
          costoL: lugar ? lugar.costo : 0,
          subtotal,
        });
  
        await detalle.save();
        detallesVenta.push(detalle._id);
      }
  
      nuevaVenta.detalles = detallesVenta;
      nuevaVenta.igv= totalVenta*(0.18);
      nuevaVenta.total = totalVenta*(1+0.18);

      await nuevaVenta.save();
  
      // Respuesta formateada
      const ventaConCliente = await Venta.findById(nuevaVenta._id)
        .populate("cliente", "nombre tipoDoc nroDoc telefono correo")
        .populate("detalles")
        .populate("lugar");
  
      const detallesFormateados = ventaConCliente.detalles.map(det => ({
        producto: {
          codInt: det.codInt,
          nombre: det.nombre,
          precio: det.precio,
        },
        cantidad: det.cantidad,
        subtotal: det.subtotal,
      }));
  
      if (ventaConCliente.lugar) {
        detallesFormateados.push({
          lugar: {
            codigo: ventaConCliente.lugar.codigo,
            distrito: ventaConCliente.lugar.distrito,
            costoL: ventaConCliente.lugar.costo,
          },
          cantidad: 1,
          subtotal: ventaConCliente.lugar.costo,
        });
      }
  
      res.json({
        mensaje: "Venta registrada",
        venta: {
          _id: ventaConCliente._id,
          tipoComprobante: ventaConCliente.tipoComprobante,
          metodoPago: ventaConCliente.metodoPago,
          estado: ventaConCliente.estado,
          total: ventaConCliente.total,
          cliente: ventaConCliente.cliente,
          detalles: detallesFormateados,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
    }
  };
  

// Obtener todas las ventas
exports.obtenerVentas = async (req, res) => {
  try {
    const ventas = await Venta.find()
      .populate("detalles")
      .populate("cliente", "nombre tipoDoc nroDoc telefono correo")
      .populate("lugar"); // ⬅ clave

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
      return res.status(400).json({ message: 'No hay facturas para exportar.' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Facturas');

    worksheet.columns = [
      { header: 'Tipo Comprobante', key: 'tipoComprobante', width: 30 },
      { header: 'Serie', key: 'serie', width: 10 },
      { header: 'N° Comprobante', key: 'nroComprobante', width: 15 },
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Fecha Emisión', key: 'fechaEmision', width: 20 },
      { header: 'Total (S/)', key: 'total', width: 15 },
      { header: 'Método de Pago', key: 'metodoPago', width: 20 },
      { header: 'Estado', key: 'estado', width: 15 }
    ];


    ventas.forEach(venta => {
      worksheet.addRow({
        tipoComprobante: venta.tipoComprobante,
        serie: venta.serie,
        nroComprobante: venta.nroComprobante,
        cliente: venta.cliente?.nombre || 'Sin cliente',
        fechaEmision: new Date(venta.fechaEmision).toLocaleDateString('es-PE'),
        total: venta.total,
        metodoPago: venta.metodoPago,
        estado: venta.estado
      });
    });


    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}.xlsx"`);
    res.end(buffer);
  } catch (error) {
    console.error('Error al exportar facturas:', error);
    res.status(500).json({ message: 'Error al generar el archivo de facturas.' });
  }
};

// 2. Luego recién define el export handler
exports.exportFacturas = async (req, res) => {
  try {
    const ventas = await Venta.find({ tipoComprobante: 'FACTURA DE VENTA ELECTRONICA' })
      .populate('cliente', 'nombre')
      .sort({ createdAt: -1 });

    await exportarFacturas(ventas, res, 'facturas_exportadas');
  } catch (error) {
    console.error('Error al exportar facturas:', error);
    res.status(500).json({ message: 'No se pudieron exportar las facturas.', error });
  }
};

// Funciones para exportar otros tipos de comprobantes reutilizando exportarFacturas

const exportarVentasPorTipo = async (tipoComprobante, res, nombreArchivo) => {
  try {
    const ventas = await Venta.find({ tipoComprobante })
      .populate('cliente', 'nombre')
      .sort({ createdAt: -1 });

    await exportarFacturas(ventas, res, nombreArchivo);
  } catch (error) {
    console.error(`Error al exportar ${tipoComprobante}:`, error);
    res.status(500).json({ message: `No se pudo exportar ${tipoComprobante}.`, error });
  }
};

exports.exportBoletas = (req, res) =>
  exportarVentasPorTipo('BOLETA DE VENTA ELECTRONICA', res, 'boletas_exportadas');

// Exportar ventas con método de pago Efectivo
exports.exportEfectivo = async (req, res) => {
  try {
    const ventas = await Venta.find({ metodoPago: 'Efectivo' })
      .populate('cliente', 'nombre')
      .sort({ createdAt: -1 });

    await exportarFacturas(ventas, res, 'ventas_efectivo');
  } catch (error) {
    console.error('Error al exportar ventas en efectivo:', error);
    res.status(500).json({ message: 'No se pudieron exportar las ventas en efectivo.', error });
  }
};

// Exportar ventas con método de pago distinto de Efectivo
exports.exportOtros = async (req, res) => {
  try {
    const ventas = await Venta.find({ metodoPago: { $ne: 'Efectivo' } })
      .populate('cliente', 'nombre')
      .sort({ createdAt: -1 });

    await exportarFacturas(ventas, res, 'ventas_otros');
  } catch (error) {
    console.error('Error al exportar ventas con otros métodos de pago:', error);
    res.status(500).json({ message: 'No se pudieron exportar las ventas con otros métodos.', error });
  }
};

exports.exportVentasGeneral = async (req, res) => {
  try {
    const ventas = await Venta.find()
      .populate('cliente', 'nombre')
      .populate('lugar') // si quieres mostrar distrito o costo
      .sort({ createdAt: -1 });

    await exportarFacturas(ventas, res, 'ventas_generales');
  } catch (error) {
    console.error('Error al exportar ventas generales:', error);
    res.status(500).json({ message: 'No se pudo exportar el listado general.', error });
  }
};

// Obtener una venta específica
exports.obtenerVenta = async (req, res) => {
  try {
    const venta = await Venta.findById(req.params.id)
      .populate("detalles")
      .populate("cliente", "nombre tipoDoc nroDoc telefono correo")
      .populate("lugar");

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
        let detalle = await DetalleVenta.findById(detalleId).populate("producto");

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
        tipoOperacion: 'Venta Registrada',
        ventaId: venta._id,
        cantidadTotal,
        fechaSalida: new Date(),
      });

      await salida.save();

    } else if (estado === "Anulado" && estadoAnterior === "Registrado") {
      let cantidadTotal = 0;

      for (let detalleId of venta.detalles) {
        let detalle = await DetalleVenta.findById(detalleId).populate("producto");

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
        tipoOperacion: 'Venta Anulada',
        ventaId: venta._id,
        cantidadTotal,
        fechaIngreso: new Date(),
      });

      await ingreso.save();
    } else if (estado === "Devolución" && estadoAnterior === "Registrado") {
      let cantidadTotal = 0;
    
      for (let detalleId of venta.detalles) {
        let detalle = await DetalleVenta.findById(detalleId).populate("producto");
    
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

    const salidas = await (await Salida.find({ ventaId: venta._id }))

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
