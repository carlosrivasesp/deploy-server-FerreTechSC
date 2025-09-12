// controllers/productoController.js
"use strict";

const ExcelJS = require("exceljs");
const mongoose = require("mongoose");
const Producto = require("../models/producto");
const Categoria = require("../models/categoria");
const Marca = require("../models/marca");

// Helpers
const isValidObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

async function resolveCategoria(input) {
    if (!input) return null;
    return isValidObjectId(input)
        ? await Categoria.findById(input)
        : await Categoria.findOne({ nombre: input });
}

async function resolveMarca(input) {
    if (!input) return null;
    return isValidObjectId(input)
        ? await Marca.findById(input)
        : await Marca.findOne({ nombre: input });
}

// ======================= CRUD =======================

exports.createProduct = async (req, res) => {
    try {
        const { categoria, marca } = req.body;

        const categoriaExistente = await resolveCategoria(categoria);
        if (!categoriaExistente) {
            return res.status(400).json({ msg: "La categoría no existe" });
        }

        const marcaExistente = await resolveMarca(marca);
        if (!marcaExistente) {
            return res.status(400).json({ msg: "La marca no existe" });
        }

        const producto = new Producto({
            ...req.body,
            categoria: categoriaExistente._id,
            marca: marcaExistente._id,
            stockActual: req.body.stockActual ?? 0,
            stockMin: req.body.stockMin ?? 9,
            estado: req.body.estado || "Activo",
        });

        await producto.save();
        res.status(201).json(producto);
    } catch (error) {
        console.log(error);
        res.status(500).send("Hubo un error");
    }
};

exports.updateProductByCodInt = async (req, res) => {
    try {
        const codIntParam = req.params.codInt;
        const codInt = isNaN(Number(codIntParam)) ? codIntParam : Number(codIntParam);
        const updates = { ...req.body };

        // Normalizar imageUrl vacía a null
        if (Object.prototype.hasOwnProperty.call(updates, "imageUrl") && updates.imageUrl === "") {
            updates.imageUrl = null;
        }

        // Permitir actualizar categoria/marca por id o nombre
        if (updates.categoria) {
            const cat = await resolveCategoria(updates.categoria);
            if (!cat) return res.status(400).json({ msg: "La categoría no existe" });
            updates.categoria = cat._id;
        }
        if (updates.marca) {
            const mar = await resolveMarca(updates.marca);
            if (!mar) return res.status(400).json({ msg: "La marca no existe" });
            updates.marca = mar._id;
        }

        const producto = await Producto.findOneAndUpdate(
            { codInt },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!producto) {
            return res.status(404).json({ message: "Producto no encontrado por codInt" });
        }

        res.json(producto);
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: err.message });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const productos = await Producto.find()
            .populate("categoria", "nombre")
            .populate("marca", "nombre");
        res.json(productos);
    } catch (error) {
        console.log(error);
        res.status(500).send("Hubo un error");
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const {
            precio,
            estado,
            imageUrl,
            nombre,
            codInt,
            stockMin,
            categoria,
            marca,
            stockActual,
        } = req.body;

        let product = await Producto.findById(req.params.id)
            .populate("categoria", "nombre")
            .populate("marca", "nombre");

        if (!product) return res.status(404).json({ msg: "No existe el producto" });

        if (precio !== undefined) product.precio = precio;
        if (estado !== undefined) product.estado = estado;
        if (imageUrl !== undefined) product.imageUrl = imageUrl;
        if (nombre !== undefined) product.nombre = nombre;
        if (codInt !== undefined) product.codInt = codInt;
        if (stockMin !== undefined) product.stockMin = stockMin;
        if (stockActual !== undefined) product.stockActual = stockActual;

        if (categoria) {
            const categoriaExistente = await resolveCategoria(categoria);
            if (!categoriaExistente) return res.status(400).json({ msg: "La categoría no existe" });
            product.categoria = categoriaExistente._id;
        }
        if (marca) {
            const marcaExistente = await resolveMarca(marca);
            if (!marcaExistente) return res.status(400).json({ msg: "La marca no existe" });
            product.marca = marcaExistente._id;
        }

        const actualizado = await Producto.findOneAndUpdate(
            { _id: req.params.id },
            product,
            { new: true, runValidators: true }
        );

        res.json(actualizado);
    } catch (error) {
        console.log(error);
        res.status(500).send("Hubo un error");
    }
};

exports.getProduct = async (req, res) => {
    try {
        const product = await Producto.findById(req.params.id)
            .populate("categoria", "nombre")
            .populate("marca", "nombre");

        if (!product) return res.status(404).json({ msg: "No existe el producto" });

        res.json(product);
    } catch (error) {
        console.log(error);
        res.status(500).send("Hubo un error");
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Producto.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: "No existe el producto" });

        await Producto.findOneAndDelete({ _id: req.params.id });
        res.json({ msg: "Producto eliminado con éxito" });
    } catch (error) {
        console.log(error);
        res.status(500).send("Hubo un error");
    }
};

// ======================= EXPORTACIONES A EXCEL =======================

const exportarProductos = async (productos, res, nombreArchivo) => {
    try {
        if (!productos || productos.length === 0) {
            return res.status(400).json({ message: "No hay productos para exportar." });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Productos");

        worksheet.columns = [
            { header: "Código", key: "codInt", width: 15 },
            { header: "Nombre", key: "nombre", width: 25 },
            { header: "Precio", key: "precio", width: 12 },
            { header: "Stock Actual", key: "stockActual", width: 15 },
            { header: "Stock Mínimo", key: "stockMin", width: 15 },
            { header: "Categoría", key: "categoria", width: 20 },
            { header: "Marca", key: "marca", width: 20 },
            { header: "Estado", key: "estado", width: 15 },
        ];

        productos.forEach((p) => {
            worksheet.addRow({
                codInt: p.codInt,
                nombre: p.nombre,
                precio: p.precio,
                stockActual: p.stockActual,
                stockMin: p.stockMin,
                categoria: p.categoria?.nombre ?? p.categoria,
                marca: p.marca?.nombre ?? p.marca,
                estado: p.estado,
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", `attachment; filename="${nombreArchivo}.xlsx"`);

        res.end(buffer);
    } catch (error) {
        console.error("Error al generar el archivo Excel:", error);
        return res.status(500).json({ message: "Hubo un error al generar el archivo." });
    }
};

// Exportar todos los productos
exports.exportTotalProducts = async (req, res) => {
    try {
        const productos = await Producto.find()
            .populate("categoria", "nombre")
            .populate("marca", "nombre");
        await exportarProductos(productos, res, "productos_total");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al exportar todos los productos.");
    }
};

// Exportar productos disponibles
exports.exportAvailableProducts = async (req, res) => {
    try {
        const productos = await Producto.find({ stockActual: { $gt: 0 } })
            .populate("categoria", "nombre")
            .populate("marca", "nombre");
        await exportarProductos(productos, res, "productos_disponibles");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al exportar productos disponibles.");
    }
};

// Exportar productos agotados
exports.exportOutOfStockProducts = async (req, res) => {
    try {
        const productos = await Producto.find({ stockActual: 0 })
            .populate("categoria", "nombre")
            .populate("marca", "nombre");
        await exportarProductos(productos, res, "productos_agotados");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al exportar productos agotados.");
    }
};

// Exportar productos con poco stock (<= 9)
exports.exportLowStockProducts = async (req, res) => {
    try {
        const productos = await Producto.find({ stockActual: { $lte: 9 } })
            .populate("categoria", "nombre")
            .populate("marca", "nombre");
        await exportarProductos(productos, res, "productos_poco_stock");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al exportar productos con poco stock.");
    }
};

// Exportar productos descontinuados
exports.exportDiscontinuedProducts = async (req, res) => {
    try {
        const productos = await Producto.find({ estado: "Descontinuado" })
            .populate("categoria", "nombre")
            .populate("marca", "nombre");
        await exportarProductos(productos, res, "productos_descontinuados");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al exportar productos descontinuados.");
    }
};

// ======================= Consultas específicas =======================

// Obtener productos por proveedor (según marcas asociadas al proveedor)
exports.obtenerProductosPorProveedor = async (req, res) => {
    const { idProveedor } = req.params;

    if (!isValidObjectId(idProveedor)) {
        return res.status(400).json({ mensaje: "ID de proveedor inválido" });
    }

    try {
        const marcasProveedor = await Marca.find({ proveedor: idProveedor });
        const idsMarcas = marcasProveedor.map((m) => m._id);

        const productos = await Producto.find({ marca: { $in: idsMarcas } })
            .populate("marca", "nombre")
            .populate("categoria", "nombre");

        res.status(200).json(productos);
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json({ mensaje: "Error al obtener productos por proveedor", error });
    }
};
