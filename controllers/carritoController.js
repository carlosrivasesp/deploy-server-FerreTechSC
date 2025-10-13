const Carrito = require('../models/carrito');
const Producto = require('../models/producto');
const Venta = require('../models/venta');
const DetalleVenta = require('../models/detalleventa');
const mongoose2 = require('mongoose');
const Operacion = require("../models/operacion");
const DetalleOperacion = require("../models/detalleOperacion");
const Entrega = require("../models/entregas");

function totales(items) {
    const subtotal = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
    const igv = +(subtotal * 0.18).toFixed(2);
    const total = +(subtotal + igv).toFixed(2);
    return { subtotal, igv, total };
}

exports.getCart = async (req, res) => {
    const user = req.userId;
    let cart = await Carrito.findOne({ user }).populate('items.producto');
    if (!cart) cart = await Carrito.create({ user, items: [] });
    const { subtotal, igv, total } = totales(cart.items);
    res.json({ items: cart.items, moneda: 'S/', subtotal, igv, total });
};


exports.addItem = async (req, res) => {
    const user = req.userId;
    const { productId, cantidad = 1 } = req.body;
    if (!mongoose2.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ error: 'productId inválido' });
    }
    const producto = await Producto.findById(productId);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    if (producto.estado === 'Descontinuado') return res.status(400).json({ error: 'Producto descontinuado' });


    let cart = await Carrito.findOne({ user });
    if (!cart) cart = await Carrito.create({ user, items: [] });


    const idx = cart.items.findIndex(it => String(it.producto) === String(productId));
    if (idx >= 0) {
        cart.items[idx].cantidad += cantidad;
    } else {
        cart.items.push({
            producto: producto._id,
            nombre: producto.nombre,
            precio: producto.precio,
            imageUrl: producto.imageUrl,
            cantidad
        });
    }
    await cart.save();


    const { subtotal, igv, total } = totales(cart.items);
    res.status(201).json({ items: cart.items, moneda: 'S/', subtotal, igv, total });
};


exports.setQty = async (req, res) => {
    const user = req.userId;
    const { productId } = req.params;
    const { cantidad } = req.body;
    if (typeof cantidad !== 'number' || cantidad < 0) return res.status(400).json({ error: 'cantidad debe ser >= 0' });


    const cart = await Carrito.findOne({ user });
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });


    const idx = cart.items.findIndex(it => String(it.producto) === String(productId));
    if (idx === -1) return res.status(404).json({ error: 'Producto no está en el carrito' });


    if (cantidad === 0) {
        cart.items.splice(idx, 1);
    } else {
        cart.items[idx].cantidad = cantidad;
    }
    await cart.save();
    const { subtotal, igv, total } = totales(cart.items);
    res.json({ items: cart.items, moneda: 'S/', subtotal, igv, total });
};


exports.removeItem = async (req, res) => {
    const user = req.userId;
    const { productId } = req.params;
    const cart = await Carrito.findOne({ user });
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
    const newItems = cart.items.filter(it => String(it.producto) !== String(productId));
    cart.items = newItems;
    await cart.save();
    const { subtotal, igv, total } = totales(cart.items);
    res.json({ items: cart.items, moneda: 'S/', subtotal, igv, total });
};

exports.checkout = async (req, res) => {
  try {
    const user = req.userId;
    const {
      tipoComprobante,
      metodoPago,
      cliente,
      servicioDelivery = false
    } = req.body || {};

    // Validaciones
    if (!['FACTURA DE VENTA ELECTRONICA', 'BOLETA DE VENTA ELECTRONICA'].includes(tipoComprobante)) {
      return res.status(400).json({ error: 'tipoComprobante inválido' });
    }
    if (!['Transferencia', 'Efectivo', 'Tarjeta de credito', 'Tarjeta de debito', 'Yape', 'Plin'].includes(metodoPago)) {
      return res.status(400).json({ error: 'metodoPago inválido' });
    }
    if (!mongoose2.Types.ObjectId.isValid(cliente)) {
      return res.status(400).json({ error: 'cliente inválido' });
    }

    // Obtener carrito
    const cart = await Carrito.findOne({ user });
    if (!cart || cart.items.length === 0)
      return res.status(400).json({ error: 'Carrito vacío' });

    // Revalidar productos desde DB
    const items = [];
    for (const it of cart.items) {
      const p = await Producto.findById(it.producto);
      if (!p)
        return res.status(404).json({ error: `Producto no encontrado: ${it.producto}` });
      if (p.estado === 'Descontinuado')
        return res.status(400).json({ error: `Producto descontinuado: ${p.nombre}` });
      if (p.stockActual < it.cantidad)
        return res.status(400).json({ error: `Stock insuficiente para ${p.nombre}` });

      items.push({
        producto: p,
        cantidad: it.cantidad,
        precio: p.precio,
        nombre: p.nombre,
        codInt: p.codInt
      });
    }

    // Calcular totales
    const subtotal = items.reduce((acc, x) => acc + x.cantidad * x.precio, 0);
    const igv = +(subtotal * 0.18).toFixed(2);
    const total = +(subtotal + igv).toFixed(2);

    // 🔹 Generar número correlativo de pedido
    const lastPedido = await Operacion.findOne({ tipoOperacion: 1 }).sort({ nroOperacion: -1 });
    let nroOperacion = 1;
    if (lastPedido && lastPedido.nroOperacion) {
      nroOperacion = lastPedido.nroOperacion + 1;
    }

    // Crear Pedido
    const nuevoPedido = new Operacion({
      tipoOperacion: 1,
      nroOperacion,
      cliente: new mongoose2.Types.ObjectId(cliente),
      servicioDelivery,
      igv,
      total,
      estado: 'Pagado',
      detalles: []
    });

    await nuevoPedido.save();

    // Crear Detalles del Pedido
    const detallesPedido = [];
    for (const x of items) {
      const subtotal = +(x.cantidad * x.precio).toFixed(2);
      const det = new DetalleOperacion({
        operacion: nuevoPedido._id,
        producto: x.producto._id,
        codInt: x.codInt,
        nombre: x.nombre,
        cantidad: x.cantidad,
        precio: x.precio,
        subtotal
      });
      await det.save();
      detallesPedido.push(det._id);
    }

    nuevoPedido.detalles = detallesPedido;
    await nuevoPedido.save();

    // 🔹 Crear Venta asociada
    const nuevaVenta = new Venta({
      tipoComprobante,
      metodoPago,
      cliente: new mongoose2.Types.ObjectId(cliente),
      fechaEmision: Date.now(),
      fechaVenc: new Date(),
      igv,
      total,
      estado: "Registrado",
      detalles: [],
    });

    await nuevaVenta.save();

    // Crear detalles de la venta
    const detallesVenta = [];
    for (const x of items) {
      const subtotal = +(x.cantidad * x.precio).toFixed(2);
      const detVenta = new DetalleVenta({
        venta: nuevaVenta._id,
        producto: x.producto._id,
        codInt: x.codInt,
        nombre: x.nombre,
        cantidad: x.cantidad,
        precio: x.precio,
        subtotal
      });
      await detVenta.save();
      detallesVenta.push(detVenta._id);
    }

    nuevaVenta.detalles = detallesVenta;
    await nuevaVenta.save();

    // 🚚 Crear Entrega si el pedido lleva delivery
    if (servicioDelivery) {
      const entrega = new Entrega({
        operacionId: nuevoPedido._id,
        estado: 'Pendiente'
      });
      await entrega.save();
    }

    // Vaciar carrito
    cart.items = [];
    await cart.save();

    res.status(201).json({
      mensaje: "Checkout completado: pedido, venta y entrega (si aplica) creados correctamente.",
      pedido: nuevoPedido,
      venta: nuevaVenta,
      servicioDelivery
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor", detalle: error.message });
  }
};
