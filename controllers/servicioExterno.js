

exports.consultarReniec = async (req, res) => {
  const { dni } = req.params;

  try {
    const response = await fetch(
      `https://api.decolecta.com/v1/reniec/dni?numero=${dni}`,
      {
        headers: {
          Authorization: `Bearer sk_11328.kl4UFN2BJDWWAikAmYHqDvt3glaPwDXK`, // 🔐 tu token real
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return res.status(response.status).json({
        error: "Error consultando API Decolecta",
        detalle: errorData,
      });
    }

    const data = await response.json();

    res.json({
      full_name: data.full_name,
      document_number: data.document_number,
    });
  } catch (error) {
    console.error("Error consultando RENIEC:", error.message);

    res.status(500).json({
      error: "Error interno consultando RENIEC",
      detalle: error.message,
    });
  }
};
