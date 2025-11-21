const DetalleCompra = require("../models/detallecompra");
const Producto = require("../models/producto");
const mongoose = require("mongoose");
const OrdenCompra = require("../models/ordenCompra")

exports.registrarOrdenCompra = async (req, res) => {
  try {
    const { proveedor, detalles } = req.body;

    if (!proveedor || !detalles || detalles.length === 0) {
      return res.status(400).json({ mensaje: "Datos incompletos" });
    }

    // Generar codigo
    const ultimaOrden = await OrdenCompra.findOne().sort({ codigo: -1 });
    let nuevoCodigo = "OC001";
    if (ultimaOrden) {
      const numero = parseInt(ultimaOrden.codigo.replace("OC", "")) + 1;
      nuevoCodigo = "OC" + numero.toString().padStart(3, "0");
    }

    let total = 0;
    let detallesIds = [];

    for (let d of detalles) {
      const producto = await Producto.findById(d.producto);
      if (!producto) continue;

      const precioCompra = producto.precio;
      const subtotal = precioCompra * d.cantidad;
      total += subtotal;

      const detalle = new DetalleCompra({
        producto: producto._id,
        cantidad: d.cantidad,
        precio: precioCompra,
        subtotal
      });
      await detalle.save();
      detallesIds.push(detalle._id);
    }

    const orden = new OrdenCompra({
      codigo: nuevoCodigo,
      proveedor,
      detalles: detallesIds,
      total,
      estado: "Pendiente"
    });

    await orden.save();
    res.json({ mensaje: "Orden de compra registrada", orden });

  } catch (error) {
    res.status(500).json({ mensaje: "Error en servidor", error: error.message });
  }
};


exports.obtenerOrdenes = async (req, res) => {
  try {
    const ordenes = await OrdenCompra.find()
      .populate("detalles")
      .populate("proveedor", "nombre tipoDoc nroDoc telefono correo")
      .populate({
        path: "detalles",
        populate: { path: "producto", select: "nombre precio codInt" },
      });

    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener órdenes", error: error.message });
  }
};

exports.obtenerOrden = async (req, res) => {
  try {
    const oc = await OrdenCompra.findById(req.params.id)
      .populate("detalles")
      .populate("proveedor", "nombre tipoDoc nroDoc telefono correo")
      .populate({
        path: "detalles",
        populate: { path: "producto", select: "nombre precio codInt" }
      });

    if (!oc) {
      return res.status(404).json({ mensaje: "Orden de compra no existe" });
    }

    res.json(oc);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener orden", error });
  }
};

exports.actualizarOrden = async (req, res) => {
  try {
    const { estado } = req.body;

    const oc = await OrdenCompra.findById(req.params.id);
    if (!oc) {
      return res.status(404).json({ mensaje: "Orden no encontrada" });
    }

    oc.estado = estado || oc.estado;

    await oc.save();

    res.json({
      mensaje: "Orden actualizada correctamente",
      orden: oc
    });

  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar orden", error });
  }
};
