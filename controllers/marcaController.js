const Marca = require('../models/marca');
const Proveedor = require('../models/proveedor');

// Obtener todas las marcas
exports.getMarcas = async (req, res) => {
    try {
        const marcas = await Marca.find().populate('proveedor');
        res.json(marcas);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor', error });
    }
};

// Obtener una marca por ID
exports.getMarca = async (req, res) => {
    try {
        const marca = await Marca.findById(req.params.id).populate('proveedor');

        if (!marca) {
            return res.status(404).json({ mensaje: 'Marca no encontrada' });
        }

        res.json(marca);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor', error });
    }
};

// Registrar una nueva marca
exports.registerMarca = async (req, res) => {
    try {
        const { proveedor } = req.body;
        
        const proveedorExistente = await Proveedor.findById( proveedor );
        if (!proveedorExistente) {
            return res.status(400).json({ msg: 'El proveedor no existe' });
        }

        const nuevaMarca = new Marca({
            ...req.body,
            proveedor: proveedorExistente._id
        });
        
        await nuevaMarca.save();
        res.send(nuevaMarca);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor', error });
    }
};

// Editar marca
exports.editMarca = async (req, res) => {
    try {
        const { nombre, proveedor } = req.body;
        let marca = await Marca.findById(req.params.id);

        if (!marca) {
            return res.status(404).json({ msg: 'No existe la marca' });
        }

        marca.nombre = nombre;
        marca.proveedor = proveedor;

        marca = await Marca.findOneAndUpdate({ _id: req.params.id }, marca, { new: true });
        res.json(marca);
    } catch (error) {
        console.log(error);
        res.status(500).send('Hubo un error');
    }
};

// Eliminar marca
exports.deleteMarca = async (req, res) => {
    try {
        let marca = await Marca.findById(req.params.id);

        if (!marca) {
            return res.status(404).json({ msg: 'No existe la marca' });
        }

        await Marca.findOneAndDelete({ _id: req.params.id });
        res.json({ msg: 'Marca eliminada con éxito' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor', error });
    }
};
