// utils/email.js
const nodemailer = require("nodemailer");
require("dotenv").config();

// 1. Configurar el "transporter" (el servicio que envía)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // "smtp.gmail.com"
  port: process.env.EMAIL_PORT, // 465
  secure: true, // true para puerto 465
  auth: {
    user: process.env.EMAIL_USER, // Tu correo de Gmail
    pass: process.env.EMAIL_PASS, // Tu contraseña de aplicación de 16 dígitos
  },
  // NOTA: Quitamos la línea 'tls: { ciphers: 'SSLv3' }' que era solo para Outlook
});

/**
 * Función genérica para enviar un correo electrónico
 * @param {string} destinatario - El email del cliente
 * @param {string} asunto - El asunto del correo
 * @param {string} html - El cuerpo del correo en formato HTML
 */
const enviarEmail = async (destinatario, asunto, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error(
        "Error: Credenciales de email (EMAIL_USER, EMAIL_PASS) no están configuradas en .env"
      );
      return;
    }

    const mailOptions = {
      from: `"FerreTech SC" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `Correo enviado exitosamente a ${destinatario}. MessageId: ${info.messageId}`
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error al enviar email a ${destinatario}:`, error);
    return { success: false, error: error };
  }
};

module.exports = { enviarEmail };
