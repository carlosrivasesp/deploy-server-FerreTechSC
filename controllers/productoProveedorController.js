const Producto = require('../models/producto');
const ProductoProveedor = require('../models/productoProveedor');

exports.registrarProductoProveedor = async (req, res) => {
  try {
    const { codInt, nombre, precio, categoria, marca } = req.body;

    if (!codInt || !nombre || !precio || !categoria || !marca) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    const existeProducto = await ProductoProveedor.findOne({ codInt });
    if (existeProducto) {
      return res.status(400).json({ message: 'Ya existe un producto con ese código interno.' });
    }

    const nuevoProducto = new ProductoProveedor({
      codInt,
      nombre,
      precio,
      categoria,
      marca,
    });

    const productoGuardado = await nuevoProducto.save();

    res.status(201).json({
      message: 'Producto del proveedor registrado exitosamente.',
      producto: productoGuardado,
    });
  } catch (error) {
    console.error('Error al registrar producto del proveedor:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.obtenerProductosProveedor = async (req, res) => {
  try {
    const productos = await ProductoProveedor.find()
      .populate('categoria', 'nombre')
      .populate('marca', 'nombre');

    res.status(200).json(productos);
  } catch (error) {
    console.error('Error al obtener productos del proveedor:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.obtenerProductoProveedorPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await ProductoProveedor.findById(id)
      .populate('categoria', 'nombre')
      .populate('marca', 'nombre');

    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    res.status(200).json(producto);
  } catch (error) {
    console.error('Error al obtener producto del proveedor por ID:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

exports.obtenerProductosConProveedor = async (req, res) => {
  try {
    const productosBajoStock = await Producto.find({
      $expr: { $lte: ["$stockActual", "$stockMin"] }
    })
      .populate('categoria', 'nombre')
      .populate('marca', 'nombre')
      .populate({
        path: 'productoProveedor',
        populate: [
          { path: 'categoria', select: 'nombre' },
          { path: 'marca', select: 'nombre' }
        ]
      });

    const resultado = productosBajoStock.map(prodFerreteria => {
      const prodProveedor = prodFerreteria.productoProveedor;

      return {
        idProductoFerreteria: prodFerreteria._id,
        idProductoProveedor: prodProveedor?._id || null,
        codInt: prodFerreteria.codInt,
        nombre: prodFerreteria.nombre,
        stockActual: prodFerreteria.stockActual,
        stockMin: prodFerreteria.stockMin,
        categoria: prodFerreteria.categoria,
        marca: prodFerreteria.marca,
        precioFerreteria: prodFerreteria.precio,
        precioProveedor: prodProveedor?.precio || null,
        nombreProveedor: prodProveedor?.marca?.nombre || null
      };
    });

    res.status(200).json(resultado);
  } catch (error) {
    console.error('Error al combinar productos con proveedor:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
