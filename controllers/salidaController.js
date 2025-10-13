const Salida = require('../models/salida');
const Operacion = require('../models/operacion');

exports.obtenerSalidas = async (req, res) => {
    try {
        const salidas = await Salida.find().populate({path:'pedidoId', populate: {path: 'detalles', model:'DetalleOperacion'}});
        res.json(salidas);
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Error al obtener las salidas' });
    }
};

exports.obtenerSalida = async (req, res) => {
    try {
        const salida = await Salida.findById(req.params.id).populate({
            path: 'pedidoId',
            populate: {
              path: 'detalles', // Esto es clave
              model: 'DetalleOperacion', // Asegúrate de que coincida con tu modelo real
            }
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

    // 🔹 Verificar que el pedido exista
    const operacion = await Operacion.findById(pedidoId).populate('detalles');
    if (!operacion) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // 🔹 Validar que sea un pedido (tipoOperacion = 1)
    if (operacion.tipoOperacion !== 1) {
      return res.status(400).json({ message: 'Solo se pueden registrar salidas para pedidos' });
    }

    // 🔹 Validar que el estado sea "Enviado"
    if (operacion.estado !== 'Enviado') {
      return res.status(400).json({
        message: 'Solo se puede registrar salida para pedidos con estado "Enviado"'
      });
    }

    // 🔹 Verificar si ya se despacharon todas las unidades
    const totalSalidasPrevias = await Salida.aggregate([
      { $match: { pedidoId: operacion._id } },
      { $group: { _id: null, total: { $sum: "$cantidadTotal" } } }
    ]);

    const totalPrevio = totalSalidasPrevias.length ? totalSalidasPrevias[0].total : 0;
    const cantidadPedido = operacion.detalles.reduce((sum, d) => sum + d.cantidad, 0);

    if (totalPrevio >= cantidadPedido) {
      return res.status(400).json({ message: 'Este pedido ya fue completamente despachado' });
    }

    // 🔹 Crear nueva salida
    const nuevaSalida = new Salida({
      tipoOperacion: 'Pedido despachado',
      pedidoId,
      cantidadTotal,
      fechaSalida,
      detalles
    });

    const salidaGuardada = await nuevaSalida.save();

    // 🔹 Recalcular total de salidas después de guardar
    const totalSalidas = totalPrevio + cantidadTotal;

    res.status(201).json({
      message: 'Salida registrada correctamente',
      salida: salidaGuardada
    });
    await Operacion.findByIdAndUpdate(pedidoId, { $push: { salidas: nuevaSalida._id } });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar salida' });
  }
};