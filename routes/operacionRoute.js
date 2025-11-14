const express = require("express");
const router = express.Router();
const operacionController = require("../controllers/operacionController");

router.post("/pedido", operacionController.registrarPedido);
router.post("/cotizacion", operacionController.registrarCotizacion);

// 🔹 LÍNEA CORREGIDA
// Cambiado de "/pedido-invitado" a "/registrar-pedido-invitado"
router.post(
  "/registrar-pedido-invitado",
  operacionController.registrarPedidoInvitado
);

router.get("/", operacionController.obtenerOperaciones);
router.get("/:id", operacionController.obtenerOperacion);
router.get("/pedido/:nroDoc", operacionController.obtenerPedidoCliente);
router.put("/:id/estado", operacionController.actualizarEstado);

module.exports = router;
