const fetch = require("node-fetch");
const Venta = require("../models/venta");
const DetalleVenta = require("../models/detalleVenta");
const Cliente = require("../models/cliente");

const ACCESS_TOKEN =
    process.env.MERCADO_PAGO_ACCESS_TOKEN ||
    "APP_USR-6354092509850758-103116-856a101a2ec0d8be483b2480279369ce-2959368634";

exports.crearPreferencia = async (req, res) => {
    try {
        const ventaData = req.body;

        console.log("Datos recibidos del frontend:", ventaData);

        // Convertir items al formato de Mercado Pago
        const mpItems = ventaData.items.map(item => {
            const precioConIgv = Number((item.unit_price * 1.18).toFixed(2));
            return {
                title: item.title,
                quantity: Number(item.quantity),
                unit_price: precioConIgv,
                currency_id: "PEN"
            };
        });

        const body = {
            items: mpItems,
            back_urls: {
                success: "https://d5e7cad51588.ngrok-free.app/redirect?status=success",
                failure: "https://d5e7cad51588.ngrok-free.app/redirect?status=failure",
                pending: "https://d5e7cad51588.ngrok-free.app/redirect?status=pending"
            },

            auto_return: "approved",
            payer: ventaData.payer,

            metadata: {
                ...ventaData,
            },

            notification_url: "https://d5e7cad51588.ngrok-free.app/api/mercado-pago/webhook"
        };

        const response = await fetch(
            "https://api.mercadopago.com/checkout/preferences",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${ACCESS_TOKEN}`
                },
                body: JSON.stringify(body)
            }
        );

        const data = await response.json();
        console.log("Preferencia creada:", data);

        res.json({ init_point: data.init_point });

    } catch (error) {
        console.error("Error al crear preferencia:", error);
        res.status(500).json({ error: "Error al crear preferencia" });
    }
};

exports.webhook = async (req, res) => {
    try {
        const body = req.body;

        console.log("Webhook recibido:", JSON.stringify(body, null, 2));

        if (body.type !== "payment") {
            console.log("No es un pago confirmado. Ignorando.");
            return res.sendStatus(200);
        }

        const paymentId = body.data.id;

        // Consultamos el pago en Mercado Pago
        const resp = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`
                }
            }
        );

        const pago = await resp.json();
        if (pago.status !== "approved" || !pago.metadata?.pedido_data) {
            console.log("Pago no aprobado o sin metadata. Ignorando.");
            return res.sendStatus(200);
        }
        if (pago.status !== "approved") {
            console.log("El pago NO está aprobado. No se creará la venta.");
            return res.sendStatus(200);
        }

        console.log("PAGO APROBADO ");

        // Recuperamos la data almacenada en metadata
        const ventaData = pago.metadata?.pedido_data;
        if (!ventaData) {
            console.error("No se encontró pedido_data en metadata");
            return res.sendStatus(400);
        }
        console.log("💳 Metadata recibido:",pago.metadata);

        // Primero buscamos o creamos el cliente
        let clienteDoc;

        if (ventaData.cliente._id) {
            clienteDoc = await Cliente.findById(ventaData.cliente._id);
        }


        //Creamos cliente en la base de datos si no existe
        if (!clienteDoc) {
            clienteDoc = new Cliente({
                nombre: ventaData.cliente.nombre,
                correo: ventaData.cliente.correo,
                telefono: ventaData.cliente.telefono,
                tipoDoc: ventaData.cliente.tipo_doc||ventaData.cliente.tipoDoc,
                nroDoc: ventaData.cliente.nro_doc||ventaData.cliente.nroDoc,
                direccion: ventaData.cliente.direccion || '',
                distrito: ventaData.cliente.distrito || ''
            });

            await clienteDoc.save();
            console.log('Cliente creado: ',clienteDoc)
        }


        const nuevaVenta = new Venta({
            fecha: new Date(),
            cliente: clienteDoc._id,
            tipoComprobante: ventaData.tipo_comprobante,
            igv: ventaData.igv,
            total: ventaData.monto,
            estado: 'Registrado',
            metodoPago: ventaData.metodo_pago
        });


        const ventaGuardada = await nuevaVenta.save();

        console.log("VENTA CREADA:", ventaGuardada);

        // Guardar detalles
        for (const item of ventaData.detalles) {
            const detalle = await new DetalleVenta({
                venta: ventaGuardada._id,
                producto: item.producto?._id || null,
                cantidad: item.cantidad,
                subtotal: item.subtotal,
            }).save();

            ventaGuardada.detalles.push(detalle._id);
        }


        await ventaGuardada.save();
        console.log("Detalles guardados correctamente");

        return res.sendStatus(200);

    } catch (error) {
        console.error("❌ Error en webhook:", error);
        res.sendStatus(500);
    }
};
