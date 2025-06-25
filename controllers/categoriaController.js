const Categoria = require('../models/categoria');

// Obtener todas las categorías
exports.getCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.find();
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor', error });
    }
};

// Obtener una sola categoría por ID
exports.getCategoria = async (req, res) => {
    try {
        const categoria = await Categoria.findById(req.params.id);

        if (!categoria) {
            return res.status(404).json({ mensaje: 'Categoría no encontrada' });
        }

        res.json(categoria);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor', error });
    }
};

// Registrar una  categoría
exports.registerCategoria = async (req, res) => {
    try {
        const nuevaCategoria = new Categoria(req.body);
        await nuevaCategoria.save();
        res.send(nuevaCategoria);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor', error });
    }
};

// Editar una categoría 
exports.editCategoria = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        let categoria = await Categoria.findById(req.params.id);

        if (!categoria) {
            return res.status(404).json({ msg: 'No existe la categoría' });
        }

        categoria.nombre = nombre;
        categoria.descripcion = descripcion;

        categoria = await Categoria.findOneAndUpdate({ _id: req.params.id }, categoria, { new: true });
        res.json(categoria);
    } catch (error) {
        console.log(error);
        res.status(500).send('Hubo un error');
    }
};

// Eliminar una categoría
exports.deleteCategoria = async (req, res) => {
    try {
        let categoria = await Categoria.findById(req.params.id);

        if (!categoria) {
            return res.status(404).json({ msg: 'No existe la categoría' });
        }

        await Categoria.findOneAndDelete({ _id: req.params.id });
        res.json({ msg: 'Categoría eliminada con éxito' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor', error });
    }
};
