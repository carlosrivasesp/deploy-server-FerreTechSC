const DetalleOperacion = require('../models/detalleOperacion');
const Operacion = require('../models/operacion');
const Producto = require('../models/producto');
const Entrega = require('../models/entregas');
const mongoose = require("mongoose");

exports.registrarVenta = async (req, res) => {
  try {
    const {
      detalles: productos, tipoComprobante, metodoPago, cliente, servicioDelivery 
    } = req.body;

    if (!productos || !Array.isArray(productos)) {
        return res.status(400).json({
            mensaje: "El campo 'productos' es requerido y debe ser un array.",
        });
    }

    if (!["FACTURA DE VENTA ELECTRONICA", "BOLETA DE VENTA ELECTRONICA"].includes(tipoComprobante)
    ) {
        return res.status(400).json({ 
            mensaje: "Tipo de comprobante inválido." 
        });
    }

    if (!["Transferencia", "Efectivo", "Tarjeta de credito","Tarjeta de debito", "Yape", "Plin"].includes(metodoPago)
    ) {
      return res.status(400).json({ mensaje: "Método de pago inválido." });
    }

    if (!mongoose.Types.ObjectId.isValid(cliente)) {
        return res.status(400).json({ 
            mensaje: "clienteId no es un ObjectId válido." 
        });
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

    // Determinar serie según comprobante
    let serie = "";
    if (tipoComprobante === "FACTURA DE VENTA ELECTRONICA") {
      serie = "F01";
    } else if (tipoComprobante === "BOLETA DE VENTA ELECTRONICA") {
      serie = "B01";
    }

    // Buscar última venta del mismo tipo para generar correlativo
    const lastVenta = await Operacion.findOne({
      tipoOperacion: 1, // 1 = venta
      tipoComprobante,
    }).sort({ nroComprobante: -1 });

    let nroComprobante = "001";
    if (lastVenta && lastVenta.nroComprobante) {
      const siguiente = parseInt(lastVenta.nroComprobante) + 1;
      nroComprobante = String(siguiente).padStart(3, "0");
    }

    // Crear la venta
    const nuevaVenta = new Operacion({
      tipoOperacion: 1,
      tipoComprobante,
      metodoPago,
      estado: "Pendiente",
      detalles: [],
      igv: 0,
      total: 0,
      cliente: new mongoose.Types.ObjectId(cliente),
      servicioDelivery: servicioDelivery ?? false,
      serie,
      nroComprobante,
    });

    // Calcular IGV y total
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    await nuevaVenta.save();

    // Crear detalles
    let detallesVenta = [];
    for (let { producto, cantidad } of productosProcesados) {
      const subtotal = cantidad * producto.precio;

      const detalle = new DetalleOperacion({
        operacion: nuevaVenta._id,
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

    // Si requiere delivery, registrar entrega
    if (servicioDelivery) {
      const entrega = new Entrega({
        ventaId: nuevaVenta._id,
      });
      await entrega.save();
    }

    res.json(nuevaVenta);

  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ mensaje: "Error en el servidor", error: error.message });
  }
};

exports.registrarCompra = async (req, res) => {
  try {
    const { detalles: productos, tipoComprobante, metodoPago, proveedor } = req.body;

    // Validaciones
    if (!productos || !Array.isArray(productos)) {
      return res.status(400).json({ mensaje: "El campo 'productos' es requerido y debe ser un array." });
    }

    if (!["FACTURA DE COMPRA ELECTRONICA", "BOLETA DE COMPRA ELECTRONICA"].includes(tipoComprobante)) {
      return res.status(400).json({ mensaje: "Tipo de comprobante inválido." });
    }

    if (!["Transferencia", "Efectivo", "Tarjeta de credito", "Tarjeta de debito", "Yape", "Plin"].includes(metodoPago)) {
      return res.status(400).json({ mensaje: "Método de pago inválido." });
    }

    if (!mongoose.Types.ObjectId.isValid(proveedor)) {
      return res.status(400).json({ mensaje: "Proveedor no es un ObjectId válido." });
    }

    const proveedorExiste = await mongoose.model("Proveedor").findById(proveedor);
    if (!proveedorExiste) {
      return res.status(404).json({ mensaje: "El proveedor no existe." });
    }

    // Validar productos y calcular subtotal
    let subtotal = 0;
    let productosProcesados = [];

    for (let item of productos) {
      const producto = await Producto.findOne({ nombre: item.nombre });
      if (!producto) {
        return res.status(404).json({ mensaje: `Producto ${item.nombre} no encontrado.` });
      }

      productosProcesados.push({ producto, cantidad: item.cantidad });
      subtotal += item.cantidad * producto.precio;
    }

    // Determinar serie según comprobante
    let serie = "";
    if (tipoComprobante === "FACTURA DE COMPRA ELECTRONICA") {
      serie = "F01";
    } else if (tipoComprobante === "BOLETA DE COMPRA ELECTRONICA") {
      serie = "B01";
    }

    // Buscar última venta del mismo tipo para generar correlativo
    const lastCompra = await Operacion.findOne({
      tipoOperacion: 2,
      tipoComprobante,
    }).sort({ nroComprobante: -1 });

    let nroComprobante = "001";
    if (lastCompra && lastCompra.nroComprobante) {
      const siguiente = parseInt(lastCompra.nroComprobante) + 1;
      nroComprobante = String(siguiente).padStart(3, "0");
    }

    // Crear la compra
    const nuevaCompra = new Operacion({
      tipoOperacion: 2, 
      tipoComprobante,
      metodoPago,
      estado: "Pendiente",
      detalles: [],
      igv: 0,
      total: 0,
      proveedor: new mongoose.Types.ObjectId(proveedor),
      serie,
      nroComprobante
    });

    // Calcular IGV y total
    const igv = +(subtotal * 0.18).toFixed(2);
    const total = +(subtotal + igv).toFixed(2);

    // Crear detalles
    let detallesCompra = [];
    for (let { producto, cantidad } of productosProcesados) {
      const subtotal = cantidad * producto.precio;

      const detalle = new DetalleOperacion({
        operacion: nuevaCompra._id,
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

    nuevaCompra.detalles = detallesCompra;
    nuevaCompra.igv = igv;
    nuevaCompra.total = total;

    await nuevaCompra.save();

    res.json(nuevaCompra);

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

exports.registrarCotizacion = async (req, res) => {
  try {
    const { cliente, detalles: productos } = req.body;

    if (!cliente) {
      return res.status(400).json({ message: "El cliente es obligatorio" });
    }
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ message: "Debe enviar al menos un producto" });
    }

    // Validar productos y calcular subtotal
    let subtotal = 0;
    let productosProcesados = [];

    for (let item of productos) {
      const producto = await Producto.findOne({ nombre: item.nombre });
      if (!producto) {
        return res.status(404).json({ mensaje: `Producto ${item.nombre} no encontrado.` });
      }

      productosProcesados.push({ producto, cantidad: item.cantidad });
      subtotal += item.cantidad * producto.precio;
    }

    const lastCompra = await Operacion.findOne({
      tipoOperacion: 3,
    }).sort({ nroComprobante: -1 });

    let nroComprobante = "001";
    if (lastCompra && lastCompra.nroComprobante) {
      const siguiente = parseInt(lastCompra.nroComprobante) + 1;
      nroComprobante = String(siguiente).padStart(3, "0");
    }

    const nuevaCotizacion = new Operacion({
      nroComprobante,
      fechaEmision: Date.now(),
      fechaVenc: new Date(new Date().setDate(new Date().getDate() + 7)),
      tipoOperacion: 3,
      estado: "Pendiente",
      detalles: [],
      total: 0,
      cliente: new mongoose.Types.ObjectId(cliente)
    });

    // Calcular total
    const total = +(subtotal).toFixed(2);

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

    res.status(201).json({ message: "Cotización registrada correctamente", nuevaCotizacion });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar la cotización", error });
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
      .populate('detalles')
      .populate('proveedor');

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
          model: "Producto"
        }
      })
      .populate("cliente")
      .populate("proveedor");

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
    const { nuevoEstado, datosVenta } = req.body; 
    
    const operacion = await Operacion.findById(req.params.id).populate('detalles');
    if (!operacion) {
      return res.status(404).json({ message: "Operación no encontrada" });
    }

    switch (operacion.tipoOperacion) {
      case 1:
      case 2:
        if (nuevoEstado !== "Pagado" && nuevoEstado !== "Anulado") {
          return res.status(400).json({ message: "El estado solo puede ser 'Pagado' o 'Anulado'" });
        }
        operacion.estado = nuevoEstado;
        await operacion.save();
        return res.json({ message: "Estado actualizado correctamente", operacion });

      case 3: 
        if (!["Pendiente", "Rechazada", "Aceptada"].includes(nuevoEstado)) {
            return res.status(400).json({ message: "Estado inválido para cotización" });
        }

        if (nuevoEstado === "Aceptada") {
            if (!operacion.detalles || operacion.detalles.length === 0) {
            return res.status(400).json({ message: "No hay productos en la cotización para generar la venta" });
            }

            let subtotal = 0;
            operacion.detalles.forEach(det => {
            subtotal += det.cantidad * det.precio;
            });

            const igv = +(subtotal * 0.18).toFixed(2);
            const total = +(subtotal + igv).toFixed(2);

            const nuevaVenta = new Operacion({
            tipoOperacion: 1,
            cliente: operacion.cliente,
            detalles: operacion.detalles.map(d => d._id),
            estado: "Pagado",
            fechaEmision: new Date(),
            fechaVenc: new Date(),
            tipoComprobante: datosVenta?.tipoComprobante,
            metodoPago: datosVenta?.metodoPago,
            servicioDelivery: datosVenta?.servicioDelivery ?? false,
            subtotal,
            igv,
            total
            });

            await nuevaVenta.save();

            operacion.estado = "Aceptada";
            await operacion.save();

            return res.json({ 
            message: "Cotización aceptada y convertida en venta",
            ventaGenerada: nuevaVenta 
            });
        }

        operacion.estado = nuevoEstado;
        await operacion.save();
        return res.json({ message: "Estado actualizado correctamente", operacion });

    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar estado de la operación" });
  }
};