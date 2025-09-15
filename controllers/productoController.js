const ExcelJS = require('exceljs');
const Producto = require('../models/producto');
const Categoria = require('../models/categoria');
const Marca = require('../models/marca');
const mongoose = require('mongoose');

const sugerirCompraSiEsNecesario = require('../utils/sugerirCompra');

exports.createProduct = async (req, res) => {
    try {
        const { categoria, marca } = req.body;

        const categoriaExistente = await Categoria.findById(categoria);
        if (!categoriaExistente) {
            return res.status(400).json({ msg: 'La categoría no existe' });
        }

        const marcaExistente = await Marca.findById(marca);
        if (!marcaExistente) {
            return res.status(400).json({ msg: 'La marca no existe' });
        }

        // Crear producto con los IDs reales de marca y categoría
        const producto = new Producto({
            ...req.body,
            categoria: categoriaExistente._id,
            marca: marcaExistente._id,
            stockActual: 0,
            stockMin: req.body.stockMin || 9,
            estado: req.body.estado || 'Activo'
        });
        await producto.save();
        await sugerirCompraSiEsNecesario(producto._id);
        res.status(201).json(producto);
    } catch (error) {
        console.log(error);
        res.status(500).send('Hubo un error');
    }
};

exports.getProducts = async (req, res) => {
    try {
        const productos = await Producto.find().populate('categoria').populate({
        path: 'marca',
        populate: {
            path: 'proveedor'
        }
    });
        res.json(productos);
    } catch (error) {
        console.log(error);
        res.status(500).send('Hubo un error');
    }
};

exports.updateProduct = async (req,res) => {
    try {
        const { precio, estado, imageUrl } = req.body;
        let product = await Producto.findById(req.params.id).populate('categoria').populate('marca');

        if (!product) {
            res.status(404).json({msg: 'No existe el producto'});
        }
        product.precio = precio;
        product.estado = estado;
        product.imageUrl = imageUrl;

        product = await Producto.findOneAndUpdate({_id: req.params.id}, product, {new:true});
        res.json(product);
    } catch (error) {
        console.log(error);
        res.status(500).send('Hubo un error');
    }
}

exports.getProduct = async (req,res) => {
    try {
        let product = await Producto.findById(req.params.id).populate('categoria').populate({
        path: 'marca',
        populate: {
            path: 'proveedor'
        }
    });

        if (!product) {
            res.status(404).json({msg: 'No existe el producto'});
        }

        res.json(product);
    } catch (error) {
        console.log(error);
        res.status(500).send('Hubo un error');
    }
}

exports.deleteProduct = async (req,res) => {
    try {
        let product = await Producto.findById(req.params.id);

        if (!product) {
            res.status(404).json({msg: 'No existe el producto'});
        }

        await Producto.findOneAndDelete({_id: req.params.id});
        res.json({msg: 'Producto eliminado con exito'});

    } catch (error) {
        console.log(error);
        res.status(500).send('Hubo un error');
    }
}

const exportarProductos = async (productos, res, nombreArchivo) => {
    try {
        if (productos.length === 0) {
            return res.status(400).json({ message: 'No hay productos para exportar.' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Productos');

        worksheet.columns = [
            { header: 'Código', key: 'codInt', width: 15 },
            { header: 'Nombre', key: 'nombre', width: 25 },
            { header: 'Precio', key: 'precio', width: 10 },
            { header: 'Stock Actual', key: 'stockActual', width: 15 },
            { header: 'Stock Mínimo', key: 'stockMin', width: 15 },
            { header: 'Categoría', key: 'categoria', width: 20 },
            { header: 'Marca', key: 'marca', width: 20 },
            { header: 'Estado', key: 'estado', width: 15 }
        ];

        productos.forEach(producto => {
            const fila = {
                codInt: producto.codInt,
                nombre: producto.nombre,
                precio: producto.precio,
                stockActual: producto.stockActual,
                stockMin: producto.stockMin,
                categoria: producto.categoria?.nombre,
                marca: producto.marca?.nombre,
                estado: producto.estado
            };
        
            worksheet.addRow(fila); 
        });

        const buffer = await workbook.xlsx.writeBuffer();

        console.log('Tamaño del buffer generado:', buffer.length);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}.xlsx"`);

        res.end(buffer);
    } catch (error) {
        console.error('Error al generar el archivo Excel:', error);
        return res.status(500).json({ message: 'Hubo un error al generar el archivo.' });
    }
};


// Exportar todos los productos
exports.exportTotalProducts = async (req, res) => {
    try {
        const productos = await Producto.find().populate('marca', 'nombre').populate('categoria', 'nombre'); 
        await exportarProductos(productos, res, 'productos_total');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al exportar todos los productos.');
    }
};

// Exportar productos disponibles
exports.exportAvailableProducts = async (req, res) => {
    try {
        const productos = await Producto.find({ stockActual: { $gt: 0 } }).populate('marca', 'nombre').populate('categoria', 'nombre'); 
        await exportarProductos(productos, res, 'productos_disponibles');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al exportar productos disponibles.');
    }
};

// Exportar productos agotados
exports.exportOutOfStockProducts = async (req, res) => {
    try {
        const productos = await Producto.find({ stockActual: 0 }).populate('marca', 'nombre').populate('categoria', 'nombre'); 
        await exportarProductos(productos, res, 'productos_agotados');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al exportar productos agotados.');
    }
};

// Exportar productos con poco stock
exports.exportLowStockProducts = async (req, res) => {
    try {
        const productos = await Producto.find({stockActual: { $lte: 9 }}).populate('marca', 'nombre').populate('categoria', 'nombre'); 
        await exportarProductos(productos, res, 'productos_poco_stock');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al exportar productos con poco stock.');
    }
};

// Exportar productos descontinuados
exports.exportDiscontinuedProducts = async (req, res) => {
    try {
        const productos = await Producto.find({ estado: 'Descontinuado' }).populate('marca', 'nombre').populate('categoria', 'nombre'); 
        await exportarProductos(productos, res, 'productos_descontinuados');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al exportar productos descontinuados.');
    }
};

//Obtener los productos de un proveedor
exports.obtenerProductosPorProveedor = async (req, res) => {
    const { idProveedor } = req.params;

    if (!mongoose.Types.ObjectId.isValid(idProveedor)) {
        return res.status(400).json({ mensaje: 'ID de proveedor inválido' });
    }
    
    try {
        const marcasProveedor = await Marca.find({ proveedor: idProveedor });
        
        const idsMarcas = marcasProveedor.map(marca => marca._id);
        

        const productos = await Producto.find({ 
            marca: { $in: idsMarcas }
        }).populate('marca').populate('categoria');

        res.status(200).json(productos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener productos por proveedor', error });
    }
}

exports.obtenerProductosPorProveedorSinStock = async (req, res) => {
    const { idProveedor } = req.params;

    if (!mongoose.Types.ObjectId.isValid(idProveedor)) {
        return res.status(400).json({ mensaje: 'ID de proveedor inválido' });
    }
    
    try {
        const marcasProveedor = await Marca.find({ proveedor: idProveedor });
        
        const idsMarcas = marcasProveedor.map(marca => marca._id);
        
        const productos = await Producto.find({ 
            marca: { $in: idsMarcas }
        }).populate('marca').populate('categoria');

        const productosFiltrados = productos.filter(p => p.stockActual <= p.stockMin);

        res.status(200).json(productosFiltrados);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener productos por proveedor', error });
    }
}

exports.obtenerProductosConPocoStock = async (req, res) => {
  try {
    const productos = await Producto.find({
      $expr: { $lte: ["$stockActual", "$stockMin"] }
    })
    .populate({
        path: 'marca',
        populate: {
            path: 'proveedor'
        }
    })
    .populate('categoria');

    res.status(200).json(productos);
  } catch (error) {
    console.error('Error al obtener productos con poco stock:', error);
    res.status(500).json({ mensaje: 'Error al obtener productos con poco stock', error });
  }
};