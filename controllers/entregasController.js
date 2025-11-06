const ExcelJS = require("exceljs");
const Entrega = require("../models/entregas.js");
const Operacion = require("../models/operacion.js"); // Asegúrate que este path sea correcto

exports.getEntregas = async (req, res) => {
  try {
    const entregas = await Entrega.find().populate({
      path: "operacionId",
      populate: [
        { path: "detalles" },
        { path: "cliente", model: "Cliente" }, // ⭐️ <-- ¡AQUÍ ESTÁ EL ARREGLO #2!
      ],
    });
    res.json(entregas);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener las entregas", error });
  }
};

exports.getEntrega = async (req, res) => {
  try {
    let entrega = await Entrega.findById(req.params.id).populate({
      path: "operacionId",
      populate: [
        { path: "detalles" },
        { path: "cliente", model: "Cliente" }, // Esta ya estaba bien
      ],
    });

    if (!entrega) {
      return res.status(400).json({ mensaje: "Entrega no existe" });
    }
    res.status(200).json(entrega);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateEntrega = async (req, res) => {
  try {
    const entrega = await Entrega.findById(req.params.id);

    if (!entrega) {
      return res.status(404).json({ mensaje: "Entrega no encontrada" });
    }

    const estadoActual = entrega.estado;
    const nuevoEstado = req.body.estado;

    if (estadoActual === "Pendiente" && nuevoEstado === "En proceso") {
      entrega.estado = "En proceso";

      entrega.direccion = req.body.direccion || entrega.direccion;
      entrega.distrito = req.body.distrito || entrega.distrito;
      entrega.fechaEntrega = req.body.fechaEntrega || entrega.fechaEntrega;
      entrega.costo = req.body.costo || entrega.costo;
    } else if (estadoActual === "En proceso" && nuevoEstado === "Finalizado") {
      entrega.estado = "Finalizado"; // Lógica de finalizar venta (si aplica)
    } else if (estadoActual === "Finalizado") {
      return res.status(400).json({
        mensaje: "La entrega ya está finalizada",
      });
    } else {
      return res.status(400).json({
        mensaje: `No se puede pasar de '${estadoActual}' a '${nuevoEstado}'.`,
      });
    }

    await entrega.save();

    res.status(200).json({
      mensaje: "Estado de entrega actualizado correctamente",
      entrega,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al actualizar el estado de la entrega",
      error,
    });
  }
};

// Función helper para exportar (ajustada)
const exportarEntregas = async (entregas, res, nombreArchivo) => {
  try {
    if (entregas.length === 0) {
      return res
        .status(400)
        .json({ message: "No hay entregas para exportar." });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Entregas");

    worksheet.columns = [
      { header: "Nro. Operación", key: "nroOperacion", width: 15 },
      { header: "Cliente", key: "cliente", width: 30 },
      { header: "Direccion", key: "direccion", width: 25 },
      { header: "Distrito", key: "distrito", width: 25 },
      { header: "Estado", key: "estado", width: 10 },
      { header: "Fecha Registro", key: "fechaRegistro", width: 15 },
      { header: "Fecha Entrega", key: "fechaEntrega", width: 15 },
    ];

    entregas.forEach((entrega) => {
      // Usamos la data poblada de operacionId
      const fila = {
        nroOperacion: entrega.operacionId?.nroOperacion,
        cliente: entrega.operacionId?.cliente?.nombre,
        direccion: entrega.direccion,
        distrito: entrega.distrito,
        estado: entrega.estado,
        fechaRegistro: entrega.fechaRegistro,
        fechaEntrega: entrega.fechaEntrega,
      };
      worksheet.addRow(fila);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    console.log("Tamaño del buffer generado:", buffer.length);

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
    // ⭐️ ¡AQUÍ ESTABA EL ERROR! Se eliminó el '{' extra.
    console.error("Error al generar el archivo Excel:", error);
    return res.status(500).json({
      message: "Hubo un error al generar el archivo.",
      error: error.message,
      stack: error.stack,
    });
  }
};

// --- Funciones de Exportar (Actualizadas con el populate correcto) ---

exports.listadoGeneral = async (req, res) => {
  try {
    const entregas = await Entrega.find().populate({
      path: "operacionId",
      populate: { path: "cliente", model: "Cliente" },
    });
    await exportarEntregas(entregas, res, "ListadoGeneral_Entregas");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al exportar todos las entregas.");
  }
};

exports.entregasRealizadas = async (req, res) => {
  try {
    const entregas = await Entrega.find({ estado: "Finalizado" }).populate({
      path: "operacionId",
      populate: { path: "cliente", model: "Cliente" },
    });
    await exportarEntregas(entregas, res, "ListadoGeneral_Entregas");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al exportar todos las entregas.");
  }
};

exports.entregasPendientes = async (req, res) => {
  try {
    const entregas = await Entrega.find({ estado: "Pendiente" }).populate({
      path: "operacionId",
      populate: { path: "cliente", model: "Cliente" },
    });
    await exportarEntregas(entregas, res, "ListadoGeneral_Entregas");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al exportar todos las entregas.");
  }
};

exports.entregasProgramadas = async (req, res) => {
  try {
    const entregas = await Entrega.find({ estado: "En proceso" }).populate({
      path: "operacionId",
      populate: { path: "cliente", model: "Cliente" },
    });
    await exportarEntregas(entregas, res, "ListadoGeneral_Entregas");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al exportar todos las entregas.");
  }
};
