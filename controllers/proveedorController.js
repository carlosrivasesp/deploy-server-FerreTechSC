const Proveedor = require('../models/proveedor');

exports.getProveedores = async (req, res) => {
    try {
        const proveedores = await Proveedor.find(); //populate('idProducto');
        res.json(proveedores);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor', error });
    }
};

exports.getProveedor = async (req, res) => {
    try {
        const proveedor = await Proveedor.findById( req.params.id ); //populate('idProducto');

        if (!proveedor) {
            return res.status(404).json({ mensaje: 'Proveedor no encontrado' });
        }
        res.json(proveedor);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor', error });
    }
};

exports.registerProveedor = async (req, res) => {
    try {
        const nuevoProveedor = new Proveedor(req.body);
        await nuevoProveedor.save();
        res.send(nuevoProveedor);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor', error });
    }
};

exports.editProveedor = async (req, res) => {
   try {
           const { telefono, correo, estado } = req.body;
           let proveedor = await Proveedor.findById(req.params.id);
   
           if (!proveedor) {
               res.status(404).json({msg: 'No existe el proveedor'});
           }
           proveedor.telefono = telefono;
           proveedor.correo = correo;
           proveedor.estado = estado;
   
           proveedor = await Proveedor.findOneAndUpdate({_id: req.params.id}, proveedor, {new:true});
           res.json(proveedor);
    } catch (error) {
           console.log(error);
           res.status(500).send('Hubo un error');
    }
};

exports.deleteProveedor = async (req, res) => {
    try {
        let proveedor = await Proveedor.findById(req.params.id);
        
                if (!proveedor) {
                    res.status(404).json({msg: 'No existe el proveedor'});
                }
        
                await Proveedor.findOneAndDelete({_id: req.params.id});
                res.json({msg: 'Proveedor eliminado con exito'});
        
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor', error });
    }
};
