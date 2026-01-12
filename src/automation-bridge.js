// VYT-MUSIC: Automation Bridge con Webhooks n8n
// Conecta eventos de Firebase con flujos de automatización externos

class AutomationBridge {
    constructor() {
        // 🔌 CONFIGURACIÓN DE WEBHOOKS N8N
        // ⚠️ REEMPLAZAR CON TUS URLs REALES DE N8N
        this.webhooks = {
            // Webhook para enviar video a Google Drive
            videoUpload: 'https://n8n.tudominio.com/webhook/vyt-video-upload',
            
            // Webhook para solicitar pago tras aprobación
            videoApproved: 'https://n8n.tudominio.com/webhook/vyt-video-approved',
            
            // Webhook para notificar rechazo
            videoRejected: 'https://n8n.tudominio.com/webhook/vyt-video-rejected',
            
            // Webhook para actualizar estado de pago
            paymentUpdate: 'https://n8n.tudominio.com/webhook/vyt-payment-update'
        };
        
        this.enabled = true; // Cambiar a false para desactivar webhooks
    }

    /**
     * Disparar webhook cuando artista sube un video
     * @param {Object} videoData - Datos del video subido
     * @param {Object} userData - Datos del usuario
     */
    async onVideoUpload(videoData, userData) {
        if (!this.enabled) {
            console.log('🔌 Webhooks desactivados');
            return;
        }

        const payload = {
            event: 'video_upload',
            timestamp: new Date().toISOString(),
            video: {
                id: videoData.id,
                titulo: videoData.titulo || videoData.nombreCancion,
                url: videoData.videoURL || videoData.link_youtube,
                genero: videoData.genero,
                duracion: videoData.duracion,
                estado: 'pendiente'
            },
            artista: {
                uid: userData.uid,
                nombre: userData.nombre_artista || userData.nombre,
                email: userData.email,
                telefono: userData.telefono || userData.whatsapp
            },
            actions_required: [
                'Descargar video desde YouTube',
                'Subir a Google Drive',
                'Generar link de compartir',
                'Actualizar Firestore con driveURL'
            ]
        };

        try {
            console.log('🚀 Enviando a n8n (video upload):', payload);
            
            const response = await fetch(this.webhooks.videoUpload, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Webhook video upload ejecutado:', result);
                return { success: true, data: result };
            } else {
                console.error('❌ Error en webhook:', response.status);
                return { success: false, error: response.statusText };
            }
        } catch (error) {
            console.error('❌ Error enviando webhook:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Disparar webhook cuando admin aprueba un video
     * @param {Object} videoData - Datos del video aprobado
     * @param {Object} userData - Datos del usuario
     */
    async onVideoApproved(videoData, userData) {
        if (!this.enabled) {
            console.log('🔌 Webhooks desactivados');
            return;
        }

        const payload = {
            event: 'video_approved',
            timestamp: new Date().toISOString(),
            video: {
                id: videoData.id,
                titulo: videoData.titulo || videoData.nombreCancion,
                url: videoData.videoURL || videoData.link_youtube,
                genero: videoData.genero,
                estado: 'waiting_payment' // Cambiará en Firestore
            },
            artista: {
                uid: userData.uid,
                nombre: userData.nombre_artista || userData.nombre,
                email: userData.email,
                telefono: userData.telefono || userData.whatsapp
            },
            pago: {
                monto: 5000, // ARS - Ajustar según configuración
                concepto: `Inscripción certamen - ${videoData.titulo}`,
                metodo: 'mercadopago',
                estado: 'pendiente'
            },
            actions_required: [
                'Generar link de pago con MercadoPago',
                'Enviar email con link de pago',
                'Enviar WhatsApp con link de pago',
                'Actualizar estado a waiting_payment en Firestore'
            ]
        };

        try {
            console.log('🚀 Enviando a n8n (video approved):', payload);
            
            const response = await fetch(this.webhooks.videoApproved, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Webhook video approved ejecutado:', result);
                
                // Retornar link de pago si n8n lo generó
                if (result.payment_link) {
                    return { 
                        success: true, 
                        payment_link: result.payment_link,
                        data: result 
                    };
                }
                
                return { success: true, data: result };
            } else {
                console.error('❌ Error en webhook:', response.status);
                return { success: false, error: response.statusText };
            }
        } catch (error) {
            console.error('❌ Error enviando webhook:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Disparar webhook cuando admin rechaza un video
     * @param {Object} videoData - Datos del video rechazado
     * @param {Object} userData - Datos del usuario
     * @param {String} motivo - Motivo del rechazo
     */
    async onVideoRejected(videoData, userData, motivo) {
        if (!this.enabled) {
            console.log('🔌 Webhooks desactivados');
            return;
        }

        const payload = {
            event: 'video_rejected',
            timestamp: new Date().toISOString(),
            video: {
                id: videoData.id,
                titulo: videoData.titulo || videoData.nombreCancion,
                url: videoData.videoURL || videoData.link_youtube,
                estado: 'rechazado'
            },
            artista: {
                uid: userData.uid,
                nombre: userData.nombre_artista || userData.nombre,
                email: userData.email,
                telefono: userData.telefono || userData.whatsapp
            },
            rechazo: {
                motivo: motivo,
                fecha: new Date().toISOString()
            },
            actions_required: [
                'Enviar email de rechazo con motivo',
                'Enviar WhatsApp con retroalimentación',
                'Actualizar estado a rechazado en Firestore'
            ]
        };

        try {
            console.log('🚀 Enviando a n8n (video rejected):', payload);
            
            const response = await fetch(this.webhooks.videoRejected, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Webhook video rejected ejecutado:', result);
                return { success: true, data: result };
            } else {
                console.error('❌ Error en webhook:', response.status);
                return { success: false, error: response.statusText };
            }
        } catch (error) {
            console.error('❌ Error enviando webhook:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Actualizar estado de pago en Firestore
     * @param {String} videoId - ID del video/participación
     * @param {String} nuevoEstado - Nuevo estado ('waiting_payment', 'paid', 'activo')
     */
    async updatePaymentStatus(videoId, nuevoEstado, db) {
        try {
            const updateData = {
                estado: nuevoEstado,
                [`fecha_${nuevoEstado}`]: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('participaciones').doc(videoId).update(updateData);
            console.log(`✅ Estado actualizado a: ${nuevoEstado}`);
            return { success: true };
        } catch (error) {
            console.error('❌ Error actualizando estado:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Método helper para cambiar estado a "waiting_payment"
     * @param {String} videoId - ID del video
     * @param {Object} db - Instancia de Firestore
     */
    async setWaitingPayment(videoId, db) {
        return await this.updatePaymentStatus(videoId, 'waiting_payment', db);
    }

    /**
     * Método helper para cambiar estado a "paid"
     * @param {String} videoId - ID del video
     * @param {Object} db - Instancia de Firestore
     */
    async setPaid(videoId, db) {
        return await this.updatePaymentStatus(videoId, 'paid', db);
    }

    /**
     * Método helper para cambiar estado a "activo" (publicado)
     * @param {String} videoId - ID del video
     * @param {Object} db - Instancia de Firestore
     */
    async setActive(videoId, db) {
        return await this.updatePaymentStatus(videoId, 'activo', db);
    }

    /**
     * Enviar notificación de pago recibido
     * @param {Object} paymentData - Datos del pago de MercadoPago
     */
    async onPaymentReceived(paymentData) {
        if (!this.enabled) {
            console.log('🔌 Webhooks desactivados');
            return;
        }

        const payload = {
            event: 'payment_received',
            timestamp: new Date().toISOString(),
            payment: paymentData,
            actions_required: [
                'Cambiar estado a "activo" en Firestore',
                'Publicar video en la web',
                'Enviar email de confirmación',
                'Enviar WhatsApp de bienvenida'
            ]
        };

        try {
            const response = await fetch(this.webhooks.paymentUpdate, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Webhook payment received ejecutado:', result);
                return { success: true, data: result };
            } else {
                console.error('❌ Error en webhook:', response.status);
                return { success: false, error: response.statusText };
            }
        } catch (error) {
            console.error('❌ Error enviando webhook:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Test de conectividad de webhooks
     */
    async testWebhooks() {
        console.log('🧪 Testeando webhooks...');
        
        const testPayload = {
            event: 'test',
            timestamp: new Date().toISOString(),
            message: 'Test de conectividad desde VYT-MUSIC'
        };

        const results = {};

        for (const [name, url] of Object.entries(this.webhooks)) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testPayload)
                });

                results[name] = {
                    status: response.ok ? '✅ OK' : '❌ Error',
                    statusCode: response.status
                };
            } catch (error) {
                results[name] = {
                    status: '❌ Error',
                    error: error.message
                };
            }
        }

        console.table(results);
        return results;
    }
}

// Instancia global singleton
const automationBridge = new AutomationBridge();

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { automationBridge, AutomationBridge };
}

// Disponible globalmente en window
if (typeof window !== 'undefined') {
    window.automationBridge = automationBridge;
}

console.log('🔌 Automation Bridge inicializado');
