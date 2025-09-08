const functions = require("firebase-functions"); // Forcing redeployment
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineString } = require("firebase-functions/params");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

// Define environment variables
const gmailEmail = defineString("GMAIL_EMAIL");
const gmailPassword = defineString("GMAIL_PASSWORD");
const mercadopagoToken = defineString("MERCADOPAGO_TOKEN");
const siteUrl = defineString("SITE_URL", { default: "https://vytonlineprueva.web.app" });

setGlobalOptions({ region: "us-central1" });

admin.initializeApp();

let transporter;

// Function to send approval email with payment link
exports.enviarCorreoAprobacion = onDocumentUpdated(
  "participantes_online/{participantId}",
  async (event) => {
    const change = event.data;
    if (!change) {
      return null;
    }

    const newValue = change.after.data();
    const previousValue = change.before.data();
    const participantId = event.params.participantId;

    // Trigger only when participant is approved for the first time
    if (previousValue && !previousValue.aprobado && newValue.aprobado) {
      try {
        // --- 1. Initialize services ---
        if (!transporter) {
          transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: gmailEmail.value(),
              pass: gmailPassword.value(),
            },
          });
        }
        const mercadopagoClient = new MercadoPagoConfig({ accessToken: mercadopagoToken.value() });

        // --- 2. Get inscription price from Firestore ---
        const priceDoc = await admin.firestore().collection('configuracion').doc('precios').get();
        const inscripcionPrice = priceDoc.data()?.inscripcion || 30000;

        // --- 3. Create Mercado Pago Preference ---
        const preference = new Preference(mercadopagoClient);
        const preferenceData = {
          body: {
            items: [
              {
                id: participantId,
                title: "Inscripción al Certamen VYT Music",
                quantity: 1,
                unit_price: inscripcionPrice,
                currency_id: "ARS",
              },
            ],
            payer: {
              name: newValue.nombre_artista,
              email: newValue.email,
            },
            back_urls: {
              success: `${siteUrl.value()}/pago/pago_exitoso.html`,
              failure: `${siteUrl.value()}/pago/pago_fallido.html`,
              pending: `${siteUrl.value()}/pago/pago_pendiente.html`,
            },
            auto_return: "approved",
            external_reference: participantId, // Link payment to participant
            notification_url: `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/recibirNotificacionPago`,
          },
        };

        const mpResponse = await preference.create(preferenceData);
        const paymentLink = mpResponse.init_point;

        // --- 4. Send Email with Payment Link ---
        const mailOptions = {
          from: `VYT Music <${gmailEmail.value()}>`,
          to: newValue.email,
          subject: "¡Has sido pre-seleccionado en VYT Music!",
          html: `<h1>¡Felicidades, ${newValue.nombre_artista}!</h1>
  <p>Tu video ha pasado la etapa de casting.</p>
  <p>Para convertirte en participante oficial del certamen, por favor completa los siguientes pasos:</p>
  <ol>
    <li>Realiza el pago de la inscripción de $${inscripcionPrice} ARS haciendo clic aquí: <a href="${paymentLink}" target="_blank">PAGAR INSCRIPCIÓN</a></li>
    <li>Envíanos el enlace de tu video final para el concurso respondiendo a este correo.</li>
  </ol>
  <p>¡Mucho éxito!</p>
  <p>El equipo de VYT Music</p>`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Approval email with payment link sent to: ${newValue.email}`);

      } catch (error) {
        console.error("Error processing approval and payment link creation:", error);
      }
    }
    return null;
  }
);

// Webhook to receive payment notifications from Mercado Pago
exports.recibirNotificacionPago = onRequest({ cors: true }, async (req, res) => {
  console.log("Webhook received from Mercado Pago");

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { type, data } = req.body;

  if (type === 'payment') {
    try {
      const mercadopagoClient = new MercadoPagoConfig({ accessToken: mercadopagoToken.value() });
      const payment = await new Payment(mercadopagoClient).get({ id: data.id });

      if (payment && payment.status === 'approved') {
        const participantId = payment.external_reference;
        if (participantId) {
          const participantRef = admin.firestore().collection('participantes_online').doc(participantId);
          await participantRef.update({
            pago_confirmado: true,
            fecha_pago: new Date().toISOString(),
            monto_pago: payment.transaction_amount,
            payment_id: payment.id
          });
          console.log(`Payment confirmed for participant: ${participantId}`);
        } else {
          console.error("Error: external_reference (participantId) not found in payment notification.");
        }
      }
    } catch (error) {
      console.error("Error processing Mercado Pago notification:", error);
      res.status(500).send('Error processing notification');
      return;
    }
  }

  res.status(200).send('Notification received');
});

// Function to send rejection email
exports.enviarCorreoRechazo = onDocumentUpdated(
  "participantes_online/{participantId}",
  async (event) => {
    const change = event.data;
    if (!change) {
      return null;
    }

    const newValue = change.after.data();
    const previousValue = change.before.data();

    // Trigger only when participant is rejected for the first time
    if (previousValue && !previousValue.rechazado && newValue.rechazado) {
      try {
        // --- Initialize services ---
        if (!transporter) {
          transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: gmailEmail.value(),
              pass: gmailPassword.value(),
            },
          });
        }

        // --- Get rejection template from Firestore ---
        const templateRef = admin.firestore().collection('configuracion').doc('plantilla_rechazo');
        const templateSnap = await templateRef.get();
        const templateData = templateSnap.data() || {};

        const subjectTemplate = templateData.asunto || "Información sobre tu postulación a VYT Music";
        const contentTemplate = templateData.contenido || `<h1>Hola, [nombre_artista]</h1>
<p>Te agradecemos tu interés y el tiempo que has dedicado para participar en VYT Music.</p>
<p>En esta ocasión, tu video no ha sido seleccionado para continuar en el certamen. El motivo es el siguiente:</p>
<p><strong>[motivo_rechazo]</strong></p>
<p>Te animamos a que sigas persiguiendo tus sueños y no dejes de hacer música. ¡Esperamos verte en futuras ediciones!</p>
<p>Saludos cordiales,</p>
<p>El equipo de VYT Music</p>`;

        // --- Personalize Email ---
        const subject = subjectTemplate.replace('[nombre_artista]', newValue.nombre_artista);
        const html = contentTemplate
          .replace('[nombre_artista]', newValue.nombre_artista)
          .replace('[motivo_rechazo]', newValue.motivo_rechazo || 'No se ha especificado un motivo.');


        // --- Send Email ---
        const mailOptions = {
          from: `VYT Music <${gmailEmail.value()}>`,
          to: newValue.email,
          subject: subject,
          html: html,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Rejection email sent to: ${newValue.email}`);

      } catch (error) {
        console.error("Error sending rejection email:", error);
      }
    }
    return null;
  }
);
