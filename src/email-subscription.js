/**
 * Sistema de Suscripción a Notificaciones de Certámenes
 * Permite a usuarios logueados suscribirse para recibir avisos
 */

/**
 * Suscribir usuario logueado a notificaciones de nuevos certámenes
 */
async function suscribirseACertamenes() {
    const btn = document.getElementById('btnSuscribirNuevos');
    const mensaje = document.getElementById('mensajeSuscripcion');
    
    if (!btn) return;
    
    // Deshabilitar botón durante el proceso
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 10px;"></i>Procesando...';
    
    try {
        // Verificar autenticación
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('Usuario no autenticado');
        }
        
        const db = firebase.firestore();
        
        // Guardar suscripción
        await db.collection('email_subscriptions').doc(user.uid).set({
            userId: user.uid,
            email: user.email,
            tipo: 'nuevos_certamenes',
            activo: true,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            origen: 'certamenes_empty_state_logged'
        }, { merge: true });
        
        // Actualizar preferencias del usuario
        await db.collection('users').doc(user.uid).set({
            notificaciones: {
                nuevosCertamenes: true,
                actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
            }
        }, { merge: true });
        
        // Mostrar éxito
        btn.style.display = 'none';
        mensaje.style.display = 'block';
        
        // Animación de éxito
        if (window.showToast) {
            showToast('¡Suscripción exitosa! 🎉', 'success');
        }
        
        console.log('✅ Usuario suscrito exitosamente');
        
    } catch (error) {
        console.error('❌ Error al suscribirse:', error);
        
        // Restaurar botón
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-bell" style="margin-right: 10px;"></i>Avisarme de Nuevos Certámenes';
        
        // Mostrar error
        if (mensaje) {
            mensaje.style.display = 'block';
            mensaje.style.color = '#ef4444';
            mensaje.innerHTML = '<i class="fas fa-times"></i> Error al suscribirse. Intenta de nuevo.';
        }
        
        if (window.showToast) {
            showToast('Error al suscribirse. Intenta de nuevo.', 'error');
        }
    }
}

/**
 * Verificar si el usuario ya está suscrito
 */
async function verificarSuscripcion(userId) {
    try {
        const db = firebase.firestore();
        const doc = await db.collection('email_subscriptions').doc(userId).get();
        
        if (doc.exists) {
            const data = doc.data();
            return data.activo === true;
        }
        
        return false;
    } catch (error) {
        console.error('Error verificando suscripción:', error);
        return false;
    }
}

/**
 * Cancelar suscripción
 */
async function cancelarSuscripcion() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return;
        
        const db = firebase.firestore();
        await db.collection('email_subscriptions').doc(user.uid).update({
            activo: false,
            canceladoEn: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        if (window.showToast) {
            showToast('Suscripción cancelada', 'info');
        }
        
        console.log('✅ Suscripción cancelada');
    } catch (error) {
        console.error('❌ Error cancelando suscripción:', error);
    }
}

// Exponer funciones globalmente
window.suscribirseACertamenes = suscribirseACertamenes;
window.verificarSuscripcion = verificarSuscripcion;
window.cancelarSuscripcion = cancelarSuscripcion;
