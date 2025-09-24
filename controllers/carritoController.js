const Carrito = require('../models/carrito');
const Producto = require('../models/producto');
const Venta = require('../models/venta');
const DetalleVenta = require('../models/detalleVenta');
const mongoose2 = require('mongoose');


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
    const user = req.userId;
    const { tipoComprobante, metodoPago, cliente, servicioDelivery = false } = req.body || {};


    if (!['FACTURA DE VENTA ELECTRONICA', 'BOLETA DE VENTA ELECTRONICA'].includes(tipoComprobante)) {
        return res.status(400).json({ error: 'tipoComprobante inválido' });
    }
    if (!['Transferencia', 'Efectivo', 'Tarjeta de credito', 'Tarjeta de debito', 'Yape', 'Plin'].includes(metodoPago)) {
        return res.status(400).json({ error: 'metodoPago inválido' });
    }
    if (!mongoose2.Types.ObjectId.isValid(cliente)) {
        return res.status(400).json({ error: 'cliente inválido' });
    }


    let cart = await Carrito.findOne({ user });
    if (!cart || cart.items.length === 0) return res.status(400).json({ error: 'Carrito vacío' });


    // Revalidar productos y precios desde DB (evita manipulación desde el front)
    const items = [];
    for (const it of cart.items) {
        const p = await Producto.findById(it.producto);
        if (!p) return res.status(404).json({ error: `Producto no encontrado: ${it.producto}` });
        if (p.estado === 'Descontinuado') return res.status(400).json({ error: `Producto descontinuado: ${p.nombre}` });
        items.push({ producto: p, cantidad: it.cantidad, precio: p.precio, nombre: p.nombre, codInt: p.codInt });
    }


    const subtotal = items.reduce((acc, x) => acc + x.cantidad * x.precio, 0);
    const igv = +(subtotal * 0.18).toFixed(2);
    const total = +(subtotal + igv).toFixed(2);


    const venta = new Venta({
        tipoComprobante,
        metodoPago,
        estado: 'Pendiente',
        detalles: [],
        igv,
        total,
        cliente: new mongoose2.Types.ObjectId(cliente),
        servicioDelivery: !!servicioDelivery,
        moneda: 'S/'
    });
    await venta.save();


    const detallesIds = [];
    for (const x of items) {
        const det = new DetalleVenta({
            venta: venta._id,
            producto: x.producto._id,
            codInt: x.codInt,
            nombre: x.nombre,
            cantidad: x.cantidad,
            precio: x.precio,
            subtotal: +(x.cantidad * x.precio).toFixed(2)
        });
        await det.save();
        detallesIds.push(det._id);
    }


    venta.detalles = detallesIds;
    await venta.save();


    // Vaciar carrito
    cart.items = [];
    await cart.save();


    res.status(201).json(venta);
};