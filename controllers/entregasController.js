const ExcelJS = require("exceljs");
const Entrega = require("../models/entregas.js");
const Operacion = require("../models/operacion.js");

exports.getEntregas = async (req, res) => {
  try {
    const entregas = await Entrega.find().populate({
      path: "operacionId",
      populate: [{ path: "detalles" }],
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
      populate: [{ path: "detalles" }],
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
      entrega.estado = "Finalizado";

      // const venta = await Venta.findById(entrega.ventaId);
      // if (venta.estado === "Pendiente") {
      //   venta.estado = "Registrado";
      //   await venta.save();
      // }
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
      { header: "Tipo Comprobante", key: "tipoComprobante", width: 15 },
      { header: "Nro. Comprobante", key: "nroComprobante", width: 15 },
      { header: "Serie", key: "serie", width: 15 },
      { header: "Direccion", key: "direccion", width: 25 },
      { header: "Distrito", key: "distrito", width: 25 },
      { header: "Estado", key: "estado", width: 10 },
      { header: "Fecha inicial", key: "fechaInicial", width: 15 },
      { header: "Fecha final", key: "fechaFinal", width: 15 },
    ];

    entregas.forEach((entrega) => {
      const fila = {
        tipoComprobante: entrega.ventaId?.tipoComprobante,
        nroComprobante: entrega.ventaId?.nroComprobante,
        serie: entrega.ventaId?.serie,
        direccion: entrega.direccion,
        distrito: entrega.ventaId?.lugar?.distrito,
        estado: entrega.estado,
        fechaInicial: entrega.fechaInicio,
        fechaFinal: entrega.fechaFin,
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
    console.error("Error al generar el archivo Excel:", error);
    return res.status(500).json({
      message: "Hubo un error al generar el archivo.",
      error: error.message,
      stack: error.stack,
    });
  }
};

exports.listadoGeneral = async (req, res) => {
  try {
    const entregas = await Entrega.find().populate({
      path: "ventaId",
      populate: {
        path: "lugar",
        select: "distrito",
      },
      select: "tipoComprobante nroComprobante serie lugar",
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
      path: "ventaId",
      populate: {
        path: "lugar",
        select: "distrito",
      },
      select: "tipoComprobante nroComprobante serie lugar",
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
      path: "ventaId",
      populate: {
        path: "lugar",
        select: "distrito",
      },
      select: "tipoComprobante nroComprobante serie lugar",
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
      path: "ventaId",
      populate: {
        path: "lugar",
        select: "distrito",
      },
      select: "tipoComprobante nroComprobante serie lugar",
    });
    await exportarEntregas(entregas, res, "ListadoGeneral_Entregas");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al exportar todos las entregas.");
  }
};
