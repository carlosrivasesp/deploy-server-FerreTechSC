const Salida = require('../models/salida');
const Operacion = require('../models/operacion');
const Producto = require('../models/producto');

exports.obtenerSalidas = async (req, res) => {
  try {
    const salidas = await Salida.find().populate({
      path: 'pedidoId',
      populate: [
        { path: 'cliente', model: 'Cliente' },
        { 
          path: 'detalles', 
          model: 'DetalleOperacion',
          populate: { path: 'producto', model: 'Producto' }
        }
      ]
    });

    res.json(salidas);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error al obtener las salidas' });
  }
};

exports.obtenerSalida = async (req, res) => {
  try {
    const salida = await Salida.findById(req.params.id)
      .populate({
        path: 'pedidoId',
        populate: [
          { path: 'cliente', model: 'Cliente' }
        ]
      })
      .populate({
        path: 'detalles.detalleId',
        model: 'DetalleOperacion',
        populate: { path: 'producto', model: 'Producto' }
      });

    if (!salida) {
      return res.status(404).json({ msg: 'Salida no encontrado' });
    }

    res.json(salida);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error al obtener la salida' });
  }
};


exports.registrarSalida = async (req, res) => {
  try {
    const { pedidoId, cantidadTotal, detalles, fechaSalida } = req.body;

    const operacion = await Operacion.findById(pedidoId).populate('detalles');
    if (!operacion) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (operacion.tipoOperacion !== 1) {
      return res.status(400).json({ message: 'Solo se pueden registrar salidas para pedidos' });
    }

    const estadosPermitidos = ['Enviado', 'Entregado'];

    if (!estadosPermitidos.includes(operacion.estado)) {
      return res.status(400).json({
        message: 'Solo se puede registrar salida para pedidos con estado Enviado o Entregado'
      });
    }

    const totalSalidasPrevias = await Salida.aggregate([
      { $match: { pedidoId: operacion._id } },
      { $group: { _id: null, total: { $sum: "$cantidadTotal" } } }
    ]);

    const totalPrevio = totalSalidasPrevias.length ? totalSalidasPrevias[0].total : 0;
    const cantidadPedido = operacion.detalles.reduce((sum, d) => sum + d.cantidad, 0);

    if (totalPrevio >= cantidadPedido) {
      return res.status(400).json({ message: 'Este pedido ya fue completamente despachado' });
    }

    const nuevaSalida = new Salida({
      tipoOperacion: 'Pedido despachado',
      pedidoId,
      cantidadTotal,
      fechaSalida,
      detalles
    });

    const salidaGuardada = await nuevaSalida.save();

    const detallesConProductos = await Salida.findById(salidaGuardada._id)
      .populate({
        path: 'detalles.detalleId',
        populate: { path: 'producto', model: 'Producto' }
      });

    for (const item of detallesConProductos.detalles) {
      const producto = item.detalleId?.producto;
      if (!producto) continue;

      if (producto.stockActual < item.cantidadSalida) {
        return res.status(400).json({
          message: `Stock insuficiente para el producto ${producto.nombre}. Stock actual: ${producto.stockActual}`
        });
      }

      producto.stockActual -= item.cantidadSalida;
      await producto.save();
    }

    await Operacion.findByIdAndUpdate(pedidoId, { $push: { salidas: salidaGuardada._id } });
    
    res.status(201).json({
      message: 'Salida registrada correctamente',
      salida: salidaGuardada
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar salida' });
  }
};