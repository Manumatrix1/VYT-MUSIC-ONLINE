const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

admin.initializeApp();

// CONFIGURACIÓN DE MERCADO PAGO
const client = new MercadoPagoConfig({ accessToken: 'TU_ACCESS_TOKEN_DE_PRODUCCION' });

// Esta función recibe las notificaciones de pagos de Mercado Pago
exports.recibirPago = functions.https.onRequest(async (req, res) => {
    const { id, type } = req.body;

    if (type !== 'payment') {
        return res.status(200).send('Notificación no es de tipo "payment", ignorando.');
    }

    try {
        const paymentId = id;
        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id: paymentId });
        const inscripcionId = paymentInfo.external_reference;

        if (paymentInfo.status === 'approved') {
            const inscripcionRef = admin.firestore().collection('participantes').doc(inscripcionId);
            await inscripcionRef.update({
                estado: 'pago confirmado',
                fecha_pago: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Pago aprobado para la inscripción: ${inscripcionId}`);
            res.status(200).send('Webhook procesado con éxito.');
        } else {
            console.log(`ℹ️ Pago pendiente o rechazado para la inscripción: ${inscripcionId}`);
            res.status(200).send('Webhook procesado, pago no aprobado.');
        }
    } catch (error) {
        console.error('❌ Error al procesar el webhook:', error);
        res.status(500).send('Error interno del servidor.');
    }
});

// Esta función crea el ID de preferencia para el botón de pago
exports.crearPreferencia = functions.https.onCall(async (data, context) => {
    const preference = new Preference(client);
    let titulo;
    let monto;

    if (data.tipoEvento === 'presencial') {
        titulo = 'Inscripción Certamen Presencial';
        monto = 30000;
    } else {
        titulo = 'Inscripción Certamen Online';
        monto = 15000;
    }

    const preferenceBody = {
        items: [{
            title: titulo,
            quantity: 1,
            unit_price: monto
        }],
        external_reference: data.inscripcionId,
        back_urls: {
            success: 'URL_DE_TU_PAGINA_DE_EXITO',
            failure: 'URL_DE_TU_PAGINA_DE_FALLO',
            pending: 'URL_DE_TU_PAGINA_PENDIENTE',
        },
        notification_url: 'URL_DE_TU_FUNCION_RECIBIRPAGO'
    };

    try {
        const result = await preference.create({ body: preferenceBody });
        return { preferenceId: result.id };
    } catch (error) {
        console.error('Error al crear la preferencia:', error);
        throw new functions.https.HttpsError('internal', 'Error al crear la preferencia de pago.');
    }
});