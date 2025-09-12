const Pedido = require('../models/pedido.js');
const DetallePedido=require('../models/detallePedido.js');
const Producto = require("../models/producto");
const mongoose = require("mongoose");

exports.obtenerPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.find()
      .populate('detalles')
      .populate('Cliente', 'nombre tipoDoc nroDoc telefono correo');
    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ mensaje: 'Error al obtener pedidos', error: error.message });
  }
};


exports.registrarPedido = async (req, res) => {
  try {
    const {
      detalles: productos,
      cliente,
    } = req.body;

    // Validaciones básicas
    if (!productos || !Array.isArray(productos)) {
      return res
        .status(400)
        .json({
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

    const nuevoPedido= new Pedido({
      estado: "Pagado",
      detalles: [],
      igv: 0,
      total: 0,
      Cliente: new mongoose.Types.ObjectId(cliente),
    });

    // Calcular IGV y total
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    await nuevoPedido.save();

    // Crear detalles
    let detallesPedido = [];
    for (let { producto, cantidad } of productosProcesados) {
      const subtotal = cantidad * producto.precio;

      const detalle = new DetallePedido({
        pedido: nuevoPedido._id,
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
    res.json(nuevoPedido);


  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ mensaje: "Error en el servidor", error: error.message });
  }
};