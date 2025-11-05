const DetalleOperacion = require('../models/detalleOperacion');
const Operacion = require('../models/operacion');
const Producto = require('../models/producto');
const Entrega = require('../models/entregas');
const Venta = require('../models/venta')
const DetalleVenta = require('../models/detalleventa')
const mongoose = require("mongoose");

exports.registrarCotizacion = async (req, res) => {
  try {
    const { cliente, detalles: productos } = req.body;

    if (!cliente) {
      return res.status(400).json({ message: "El cliente es obligatorio" });
    }
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return res
        .status(400)
        .json({ message: "Debe enviar al menos un producto" });
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

      productosProcesados.push({ producto, cantidad: item.cantidad });
      subtotal += item.cantidad * producto.precio;
    }

    const lastCotizacion = await Operacion.findOne({
      tipoOperacion: 2,
    }).sort({ nroOperacion: -1 });

    let nroOperacion = "001";
    if (lastCotizacion && lastCotizacion.nroOperacion) {
      const siguiente = parseInt(lastCotizacion.nroOperacion) + 1;
      nroOperacion = String(siguiente).padStart(3, "0");
    }

    const nuevaCotizacion = new Operacion({
      nroOperacion,
      fechaEmision: Date.now(),
      fechaVenc: new Date(new Date().setDate(new Date().getDate() + 7)),
      tipoOperacion: 2,
      estado: "Pendiente",
      detalles: [],
      total: 0,
      cliente: new mongoose.Types.ObjectId(cliente),
    });

    // Calcular total
    const total = +subtotal.toFixed(2);

    await nuevaCotizacion.save();

    // Crear detalles
    let detallesCotizacion = [];
    for (let { producto, cantidad } of productosProcesados) {
      const subtotal = cantidad * producto.precio;

      const detalle = new DetalleOperacion({
        operacion: nuevaCotizacion._id,
        producto: producto._id,
        codInt: producto.codInt,
        nombre: producto.nombre,
        cantidad,
        precio: producto.precio,
        subtotal,
      });

      await detalle.save();
      detallesCotizacion.push(detalle._id);
    }

    nuevaCotizacion.detalles = detallesCotizacion;
    nuevaCotizacion.total = total;

    await nuevaCotizacion.save();

    res
      .status(201)
      .json({
        message: "Cotización registrada correctamente",
        nuevaCotizacion,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al registrar la cotización", error });
  }
};

exports.registrarPedido = async (req, res) => {
  try {
    const {
      detalles: productos,
      cliente,
      tipoComprobante,
      metodoPago,
      servicioDelivery
    } = req.body;

    // Validaciones básicas
    if (!productos || !Array.isArray(productos)) {
      return res.status(400).json({
        mensaje: "El campo 'productos' es requerido y debe ser un array.",
      });
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
      subtotal += parseFloat((item.cantidad * producto.precio).toFixed(2));
    }

    const lastPedido = await Operacion.findOne({
      tipoOperacion: 1,
    }).sort({ nroOperacion: -1 });

    let nroOperacion = "001";
    if (lastPedido && lastPedido.nroOperacion) {
      const siguiente = parseInt(lastPedido.nroOperacion) + 1;
      nroOperacion = String(siguiente).padStart(3, "0");
    }
    let codigoUnico;
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let existe = true;
    while (existe) {
      codigoUnico = Array.from({ length: 6 }, () =>
        caracteres[Math.floor(Math.random() * caracteres.length)]
      ).join('');

      existe = await Operacion.findOne({ codigo: codigoUnico });
    }

    const nuevoPedido = new Operacion({
      nroOperacion,
      fechaEmision: Date.now(),
      fechaVenc: new Date(new Date().setDate(new Date().getDate())),
      tipoOperacion: 1,
      estado: "Pagado",
      detalles: [],
      total: 0,
      cliente: new mongoose.Types.ObjectId(cliente),
      codigo: codigoUnico
    });

    // Calcular IGV y total
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    await nuevoPedido.save();

    // Crear detalles
    let detallesPedido = [];
    for (let { producto, cantidad } of productosProcesados) {
      const subtotal = cantidad * producto.precio;

      const detalle = new DetalleOperacion({
        operacion: nuevoPedido._id,
        producto: producto._id,
        codInt: producto.codInt,
        nombre: producto.nombre,
        cantidad,
        precio: producto.precio,
        subtotal,
      });

      await detalle.save();
      detallesPedido.push(detalle._id);
    }

    nuevoPedido.detalles = detallesPedido;
    nuevoPedido.igv = parseFloat(igv.toFixed(2));
    nuevoPedido.total = parseFloat(total.toFixed(2));

    await nuevoPedido.save();

    const nuevaVenta = new Venta({
      tipoComprobante: tipoComprobante,
      metodoPago: metodoPago,
      cliente: new mongoose.Types.ObjectId(cliente),
      fechaEmision: Date.now(),
      fechaVenc: new Date(),
      igv: parseFloat(igv.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      estado: "Registrado",
      detalles: [],
    });

    await nuevaVenta.save();

    // Crear los detalles de la venta
    let detallesVenta = [];
    for (let { producto, cantidad } of productosProcesados) {
      const subtotal = cantidad * producto.precio;
      const detalleVenta = new DetalleVenta({
        venta: nuevaVenta._id,
        producto: producto._id,
        nombre: producto.nombre,
        cantidad,
        precio: producto.precio,
        subtotal,
      });

      await detalleVenta.save();
      detallesVenta.push(detalleVenta._id);
    }

    nuevaVenta.detalles = detallesVenta;
    await nuevaVenta.save();

    if (servicioDelivery) {
      const entrega = new Entrega({
        operacionId: nuevoPedido._id,
        estado: "Pendiente",
        fechaRegistro: new Date(),
      });
      await entrega.save();
    }

     res.json({
      mensaje: "Pedido y venta registrados correctamente",
      pedido: nuevoPedido,
      venta: nuevaVenta,
      servicioDelivery: !!servicioDelivery
    });

  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ mensaje: "Error en el servidor", error: error.message });
  }
};

exports.registrarPedidoInvitado = async (req, res) => {
  try {
    const { cliente, detalles: productos, servicioDelivery, tipoComprobante, metodoPago } = req.body;

    // Validar datos mínimos
    if (!cliente || !cliente.nroDoc || !cliente.nombre) {
      return res
        .status(400)
        .json({
          mensaje:
            "Datos del cliente incompletos (nombre y nroDoc son obligatorios).",
        });
    }
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return res
        .status(400)
        .json({ mensaje: "Debe incluir al menos un producto." });
    }

    // Buscar o crear cliente por nroDoc
    const Cliente = mongoose.model("Cliente");
    let clienteEncontrado = await Cliente.findOne({ nroDoc: cliente.nroDoc });

    if (!clienteEncontrado) {
      clienteEncontrado = await Cliente.create({
        nombre: cliente.nombre,
        tipoDoc: cliente.tipoDoc || "DNI",
        nroDoc: cliente.nroDoc,
        telefono: cliente.telefono || "",
        correo: cliente.correo || "",
      });
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
      subtotal += parseFloat((item.cantidad * producto.precio).toFixed(2));
    }

    const lastPedido = await Operacion.findOne({ tipoOperacion: 1 }).sort({
      nroOperacion: -1,
    });
    let nroOperacion = "001";
    if (lastPedido && lastPedido.nroOperacion) {
      const siguiente = parseInt(lastPedido.nroOperacion) + 1;
      nroOperacion = String(siguiente).padStart(3, "0");
    }

    let codigoUnico;
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let existe = true;
    while (existe) {
      codigoUnico = Array.from({ length: 6 }, () =>
        caracteres[Math.floor(Math.random() * caracteres.length)]
      ).join('');

      existe = await Operacion.findOne({ codigo: codigoUnico });
    }

    // Crear la operación (pedido)
    const nuevoPedido = new Operacion({
      nroOperacion,
      tipoOperacion: 1,
      estado: "Pagado",
      servicioDelivery: servicioDelivery || false,
      fechaEmision: new Date(),
      fechaVenc: new Date(),
      cliente: clienteEncontrado._id,
      detalles: [],
      total: 0,
      codigo: codigoUnico
    });

    // Calcular IGV y total
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    await nuevoPedido.save();

    // Crear los detalles
    let detallesPedido = [];
    for (let { producto, cantidad } of productosProcesados) {
      const subtotalItem = cantidad * producto.precio;

      const detalle = new DetalleOperacion({
        operacion: nuevoPedido._id,
        producto: producto._id,
        codInt: producto.codInt,
        nombre: producto.nombre,
        cantidad,
        precio: producto.precio,
        subtotal: subtotalItem,
      });

      await detalle.save();
      detallesPedido.push(detalle._id);
    }

    nuevoPedido.detalles = detallesPedido;
    nuevoPedido.igv = parseFloat(igv.toFixed(2));
    nuevoPedido.total = parseFloat(total.toFixed(2));
    await nuevoPedido.save();

    const nuevaVenta = new Venta({
      tipoComprobante: tipoComprobante,
      metodoPago: metodoPago,
      cliente: clienteEncontrado._id,
      fechaEmision: Date.now(),
      fechaVenc: new Date(),
      igv: parseFloat(igv.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      estado: "Registrado",
      detalles: [],
    });

    await nuevaVenta.save();

    // Crear los detalles de la venta
    let detallesVenta = [];
    for (let { producto, cantidad } of productosProcesados) {
      const subtotal = cantidad * producto.precio;
      const detalleVenta = new DetalleVenta({
        venta: nuevaVenta._id,
        producto: producto._id,
        nombre: producto.nombre,
        cantidad,
        precio: producto.precio,
        subtotal,
      });

      await detalleVenta.save();
      detallesVenta.push(detalleVenta._id);
    }

    nuevaVenta.detalles = detallesVenta;
    await nuevaVenta.save();

    if (servicioDelivery) {
      const entrega = new Entrega({
        operacionId: nuevoPedido._id, // 👈 relaciona con el pedido
        estado: "Pendiente", // puedes personalizar este estado
        fechaRegistro: new Date(),
      });
      await entrega.save();
    }

    return res.status(201).json({
      mensaje: "Pedido registrado correctamente (modo invitado)",
      pedido: nuevoPedido,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        mensaje: "Error al registrar pedido invitado",
        error: error.message,
      });
  }
};

exports.obtenerOperaciones = async (req, res) => {
  try {
    const { tipoOperacion } = req.query;

    let filter = {};
    if (tipoOperacion) {
      filter.tipoOperacion = tipoOperacion;
    }

    const operaciones = await Operacion.find(filter)
      .populate('cliente')
      .populate({
        path: 'detalles',
        populate: 'producto'
      })
      .populate('salidas');

    res.status(200).json(operaciones);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener operaciones", error });
  }
};

exports.obtenerOperacion = async (req, res) => {
  try {
    const operacion = await Operacion.findById(req.params.id)
      .populate({
        path: "detalles",
        populate: {
          path: "producto", // esto hace que cada detalle incluya los datos del producto
          model: "Producto",
        },
      })
      .populate("cliente");

    if (!operacion) {
      return res.status(404).json({ message: "Operación no encontrada" });
    }

    res.json(operacion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarEstado = async (req, res) => {
  try {
    const { nuevoEstado } = req.body; 
    
    const operacion = await Operacion.findById(req.params.id).populate('detalles');
    if (!operacion) {
      return res.status(404).json({ message: "Operación no encontrada" });
    }

    switch (operacion.tipoOperacion) {
      case 1:
        if (!["Pagado", "En preparación", "Enviado", "Entregado", "Cancelado"].includes(nuevoEstado)) {
            return res.status(400).json({ message: "Estado inválido para pedido" });
        }

        if (
          ["En preparación", "Enviado", "Entregado"].includes(operacion.estado) &&
          nuevoEstado === "Cancelado"
        ) {
          return res.status(400).json({ message: "No se puede cancelar un pedido en preparación o posterior" });
        }

        operacion.estado = nuevoEstado;
        await operacion.save();

        return res.json({ message: "Estado del pedido actualizado correctamente", operacion });

      case 2: 
        if (!["Pendiente", "Rechazada", "Aceptada"].includes(nuevoEstado)) {
          return res
            .status(400)
            .json({ message: "Estado inválido para cotización" });
        }

        if (nuevoEstado === "Aceptada") {
          if (!operacion.detalles || operacion.detalles.length === 0) {
            return res
              .status(400)
              .json({
                message:
                  "No hay productos en la cotización para generar la venta",
              });
          }

          let subtotal = 0;
          operacion.detalles.forEach((det) => {
            subtotal += det.cantidad * det.precio;
          });

            const igv = +(subtotal * 0.18).toFixed(2);
            const total = +(subtotal + igv).toFixed(2);
            operacion.estado = "Aceptada";
            await operacion.save();

          return res.json({
            message: "Cotización aceptada y convertida en venta",
            ventaGenerada: nuevaVenta,
          });
        }

        operacion.estado = nuevoEstado;
        await operacion.save();
        return res.json({ message: "Estado actualizado correctamente", operacion });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al actualizar estado de la operación" });
  }
};

exports.obtenerPedidoCliente = async (req, res) => {
  try {
    const pedido = await Operacion.find()
      .populate({
        path: "cliente",
        match: { nroDoc: req.params.nroDoc },
        select: "nombre tipoDoc nroDoc telefono correo",
      })
      .populate("detalles");

    const pedidoCliente = pedido.filter((p) => p.cliente != null);

    if (pedidoCliente.length === 0) {
      return res
        .status(400)
        .json({ mensaje: "No existen pedidos para este cliente" });
    }
    res.json(pedidoCliente);
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: "Error al obtener el pedido" });
  }
};
