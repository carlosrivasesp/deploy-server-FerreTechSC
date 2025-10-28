const Ingreso = require('../models/ingreso');
const Compra = require('../models/compra');
const Producto = require('../models/producto');
const DetalleCompra = require('../models/detallecompra');

// Obtener todos los ingresos
exports.obtenerIngresos = async (req, res) => {
  try {
    const ingresos = await Ingreso.find().populate({
      path: 'compraId',
      populate: [
        { path: 'proveedor', model: 'Proveedor' },
        {
          path: 'detalles',
          model: 'DetalleCompra',
          populate: { path: 'producto', model: 'Producto' }
        }
      ]
    });

    res.json(ingresos);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error al obtener los ingresos' });
  }
};

// Obtener un solo ingreso
exports.obtenerIngreso = async (req, res) => {
  try {
    const ingreso = await Ingreso.findById(req.params.id)
      .populate({
        path: 'compraId',
        populate: [
          { path: 'proveedor', model: 'Proveedor' }
        ]
      })
      .populate({
        path: 'detalles.detalleId',
        model: 'DetalleCompra',
        populate: { path: 'producto', model: 'Producto' }
      });

    if (!ingreso) {
      return res.status(404).json({ msg: 'Ingreso no encontrado' });
    }

    res.json(ingreso);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error al obtener el ingreso' });
  }
};

// Registrar un ingreso (entrada de productos)
exports.registrarIngreso = async (req, res) => {
  try {
    const { compraId, cantidadTotal, detalles, fechaIngreso } = req.body;

    // Buscar la compra
    const compra = await Compra.findById(compraId).populate('detalles');
    if (!compra) {
      return res.status(404).json({ message: 'Compra no encontrada' });
    }

    // Validación: solo compras "Aprobadas" se pueden ingresar
    if (compra.estado !== 'Aprobado') {
      return res.status(400).json({
        message: 'Solo se puede registrar ingreso de compras con estado "Aprobado"'
      });
    }

    // Crear el ingreso
    const nuevoIngreso = new Ingreso({
      tipoOperacion: 'Orden de compra aprobada',
      compraId,
      cantidadTotal,
      fechaIngreso,
      detalles
    });

    const ingresoGuardado = await nuevoIngreso.save();

    // Poblar para obtener los productos
    const detallesConProductos = await Ingreso.findById(ingresoGuardado._id)
      .populate({
        path: 'detalles.detalleId',
        populate: { path: 'producto', model: 'Producto' }
      });

    // Actualizar stock (SUMAR)
    for (const item of detallesConProductos.detalles) {
      const producto = item.detalleId?.producto;
      if (!producto) continue;

      producto.stockActual += item.cantidadIngreso;
      await producto.save();
    }

    // Guardar referencia del ingreso en la compra (si lo necesitas)
    await Compra.findByIdAndUpdate(compraId, { $push: { ingresos: ingresoGuardado._id } });

    res.status(201).json({
      message: 'Ingreso registrado correctamente',
      ingreso: ingresoGuardado
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar ingreso' });
  }
};
