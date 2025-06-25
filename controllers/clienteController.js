const Cliente = require("../models/cliente");
const Venta = require("../models/venta");
const ExcelJS = require("exceljs");
const Usuario = require('../models/usuario');

exports.getClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error });
  }
};

exports.getCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error });
  }
};

exports.registerCliente = async (req, res) => {
  try {
    const nuevoCliente = new Cliente(req.body);

    if (nuevoCliente.telefono == "" || nuevoCliente.telefono == null) {
      nuevoCliente.telefono = "";
    }

    if (nuevoCliente.correo == "" || nuevoCliente.correo == null) {
      nuevoCliente.correo = "";
    }

    await nuevoCliente.save();
    res.send(nuevoCliente);
  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error });
  }
};

exports.editCliente = async (req, res) => {
  try {
    const { telefono, correo, estado } = req.body;
    let cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      res.status(404).json({ msg: "No existe el cliente" });
    }
    cliente.telefono = telefono;
    cliente.correo = correo;
           cliente.estado = estado;

    cliente = await Cliente.findOneAndUpdate({ _id: req.params.id }, cliente, {
      new: true,
    });
    res.json(cliente);
  } catch (error) {
    console.log(error);
    res.status(500).send("Hubo un error");
  }
};

exports.deleteCliente = async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id);
        
        if (!cliente) {
            return res.status(404).json({ msg: 'No existe el cliente' });
        }

        // Eliminar el cliente
        await Cliente.findOneAndDelete({ _id: req.params.id });

        // Verificar si hay un usuario vinculado antes de eliminarlo
        const usuarioVinculado = await Usuario.findOne({ nroDoc: cliente.nroDoc });
        
        if (usuarioVinculado) {
            await Usuario.deleteOne({ nroDoc: cliente.nroDoc });
        }

        res.json({ msg: 'Cliente eliminado con éxito' });
        
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor', error });
    }
};

const exportarClientes = async (clientes, res, nombreArchivo) => {
  try {
    if (clientes.length === 0) {
      return res
        .status(400)
        .json({ message: "No hay clientes para exportar." });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Clientes");

    worksheet.columns = [
      { header: "Tipo Documento", key: "tipoDoc", width: 15 },
      { header: "Nro Documento", key: "nroDoc", width: 20 },
      { header: "Nombre", key: "nombre", width: 25 },
      { header: "Correo", key: "correo", width: 25 },
      { header: "Teléfono", key: "telefono", width: 15 },
    ];

    clientes.forEach((cliente) => {
      worksheet.addRow({
        tipoDoc: cliente.tipoDoc,
        nroDoc: cliente.nroDoc,
        nombre: cliente.nombre,
        correo: cliente.correo,
        telefono: cliente.telefono,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nombreArchivo}.xlsx"`
    );
    res.end(buffer);
  } catch (error) {
    console.error("Error al exportar clientes:", error);
    res.status(500).json({ message: "Error al generar el archivo Excel." });
  }
};

// Exportar por tipo de documento
exports.exportClientesNaturales = async (req, res) => {
  const clientes = await Cliente.find({ tipoDoc: "DNI" });
  await exportarClientes(clientes, res, "clientes_persona_natural");
};

exports.exportClientesEmpresas = async (req, res) => {
  const clientes = await Cliente.find({ tipoDoc: "RUC" });
  await exportarClientes(clientes, res, "clientes_empresa_ruc");
};

exports.exportClientesInactivos = async (req, res) => {
  try {
    const clientes = await Cliente.find({
      estado: { $regex: /^inactivo$/i },
    });

    if (clientes.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay clientes inactivos para exportar." });
    }

    await exportarClientes(clientes, res, "clientes_inactivos");
  } catch (error) {
    console.error("Error al exportar clientes inactivos:", error);
    res.status(500).json({ message: "Error al exportar clientes inactivos." });
  }
};

exports.exportClientesNuevos = async (req, res) => {
  try {
    const dosSemanasAtras = new Date();
    dosSemanasAtras.setDate(dosSemanasAtras.getDate() - 14); // Cambiamos a 14 días

    const clientes = await Cliente.find();

    const nuevos = clientes.filter((cliente) => {
      const fechaCreacion = cliente._id.getTimestamp();
      return fechaCreacion >= dosSemanasAtras;
    });

    await exportarClientes(nuevos, res, "clientes_nuevos");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al exportar clientes nuevos." });
  }
};

exports.exportClientesFrecuentes = async (req, res) => {
  try {
    const ventasPorCliente = await Venta.aggregate([
      { $group: { _id: "$cliente", totalVentas: { $sum: 1 } } },
      { $sort: { totalVentas: -1 } },
      { $limit: 10 },
    ]);

    const idsClientes = ventasPorCliente.map((v) => v._id);

    const clientes = await Cliente.find({ _id: { $in: idsClientes } });

    await exportarClientes(clientes, res, "clientes_frecuentes");
  } catch (error) {
    console.error("Error al obtener clientes frecuentes:", error);
    res.status(500).json({ message: "Error al exportar clientes frecuentes." });
  }
};
