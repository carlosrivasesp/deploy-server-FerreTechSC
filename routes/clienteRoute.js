const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/clienteController");

router.post("/", clienteController.registerCliente);
router.get("/", clienteController.getClientes);
router.put("/:id", clienteController.editCliente);

// Ruta original: Busca por el _id de MongoDB (si es necesario para otras partes)
router.get("/:id", clienteController.getCliente);

// ✅ NUEVA RUTA: Busca por el número de documento (DNI/RUC) para el frontend de Angular
router.get("/getClienteByNroDoc/:id", clienteController.getClienteByNroDoc);

router.delete("/:id", clienteController.deleteCliente);

// Exportación de reportes en Excel
router.get("/exportar/naturales", clienteController.exportClientesNaturales);
router.get("/exportar/empresas", clienteController.exportClientesEmpresas);
router.get("/exportar/inactivos", clienteController.exportClientesInactivos);
router.get("/exportar/nuevos", clienteController.exportClientesNuevos);
router.get("/exportar/frecuentes", clienteController.exportClientesFrecuentes);

module.exports = router;
