/**
 * Controlador para la integración con Mercado Pago
 * Crea una preferencia de pago y devuelve el init_point para redirigir al usuario
 */

const ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || 
  "APP_USR-6354092509850758-103116-856a101a2ec0d8be483b2480279369ce-2959368634";

/**
 * Crea una preferencia de pago en Mercado Pago
 * POST /api/mercado-pago/crear-preferencia
 */
exports.crearPreferencia = async (req, res) => {
  try {
    const { 
      items, 
      payer, 
      back_urls, 
      pedido_data, 
      auto_return,
      payment_methods,
      statement_descriptor,
      binary_mode,
      external_reference
    } = req.body;

    // Validaciones básicas
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "items es requerido y debe ser un array no vacío"
      });
    }

    if (!payer) {
      return res.status(400).json({
        error: "payer es requerido"
      });
    }

    // URLs por defecto
    const defaultBackUrls = {
      success: "http://localhost:4200/resumen-compra?status=success",
      failure: "http://localhost:4200/resumen-compra?status=failure",
      pending: "http://localhost:4200/resumen-compra?status=pending"
    };

    // Validar y normalizar back_urls
    let successUrl = defaultBackUrls.success;
    if (back_urls?.success && typeof back_urls.success === 'string' && back_urls.success.trim() !== "") {
      const trimmed = back_urls.success.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        successUrl = trimmed;
      }
    }
    
    const finalBackUrls = {
      success: successUrl,
      failure: (back_urls?.failure && typeof back_urls.failure === 'string' && back_urls.failure.trim() !== "") 
        ? back_urls.failure.trim()
        : defaultBackUrls.failure,
      pending: (back_urls?.pending && typeof back_urls.pending === 'string' && back_urls.pending.trim() !== "") 
        ? back_urls.pending.trim()
        : defaultBackUrls.pending
    };

    // Construir el payload para Mercado Pago
    const preferenceData = {
      items: items.map(item => ({
        title: item.title || item.nombre || "Producto",
        description: item.description || "",
        quantity: item.quantity || item.cantidad || 1,
        unit_price: parseFloat(item.unit_price || item.precio || 0),
        currency_id: "PEN"
      })),
      payer: {
        name: payer.name || payer.nombre || "",
        surname: payer.surname || payer.apellido || "",
        email: "test@testuser.com", // Email requerido para tarjetas de prueba
        phone: payer.phone ? {
          area_code: payer.phone.area_code || "",
          number: payer.phone.number || ""
        } : undefined,
        identification: payer.identification ? {
          type: payer.identification.type || "DNI",
          number: payer.identification.number || ""
        } : undefined,
        address: payer.address ? {
          street_name: payer.address.street_name || "",
          street_number: payer.address.street_number || 0,
          zip_code: payer.address.zip_code || ""
        } : undefined
      },
      back_urls: finalBackUrls,
      payment_methods: payment_methods || {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12
      },
      statement_descriptor: statement_descriptor || "FerreTechSC",
      binary_mode: binary_mode !== undefined ? binary_mode : false,
      external_reference: external_reference || pedido_data?.id || pedido_data?.pedido_id || undefined,
      ...(pedido_data && (pedido_data.id || pedido_data.pedido_id || pedido_data.cliente_id) ? {
        metadata: {
          pedido_id: pedido_data.id || pedido_data.pedido_id || null,
          cliente_id: pedido_data.cliente_id || null,
          total: pedido_data.total || null
        }
      } : {})
    };

    // Limpiar campos undefined
    Object.keys(preferenceData.payer).forEach(key => {
      if (preferenceData.payer[key] === undefined) {
        delete preferenceData.payer[key];
      }
    });

    if (preferenceData.external_reference === undefined || preferenceData.external_reference === null || preferenceData.external_reference === "") {
      delete preferenceData.external_reference;
    }

    if (preferenceData.metadata) {
      const metadataKeys = Object.keys(preferenceData.metadata);
      const hasValidData = metadataKeys.some(key => preferenceData.metadata[key] !== null && preferenceData.metadata[key] !== undefined && preferenceData.metadata[key] !== "");
      if (!hasValidData || metadataKeys.length === 0) {
        delete preferenceData.metadata;
      }
    }

    // Mercado Pago NO acepta auto_return con URLs de localhost
    const isLocalhost = successUrl.includes('localhost') || 
                       successUrl.includes('127.0.0.1') || 
                       successUrl.includes('0.0.0.0');
    
    if ((auto_return === "approved" || auto_return === "all") && !isLocalhost) {
      preferenceData.auto_return = auto_return;
    }

    // Hacer la petición a la API de Mercado Pago
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preferenceData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error de Mercado Pago:", data);
      return res.status(response.status).json({
        error: "Error al crear la preferencia de pago",
        details: data.message || data.error || "Error desconocido"
      });
    }

    // Usar sandbox_init_point si está en modo prueba
    const initPoint = data.sandbox_init_point || data.init_point;
    
    if (!initPoint) {
      console.error("Error: No se recibió init_point de Mercado Pago");
      return res.status(500).json({
        error: "Error al crear la preferencia de pago",
        details: "No se recibió URL de redirección de Mercado Pago"
      });
    }
    
    res.json({
      init_point: initPoint,
      preference_id: data.id || null,
      sandbox_init_point: data.sandbox_init_point || null,
      is_test: !!data.sandbox_init_point
    });

  } catch (error) {
    console.error("Error en crearPreferencia:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message
    });
  }
};
