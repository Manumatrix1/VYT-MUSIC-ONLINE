/**
 * VYT MUSIC - Firebase Integration Module
 * Módulo centralizado para todas las operaciones de Firebase
 * Versión: 2026-01-12
 */

class FirebaseIntegration {
    constructor() {
        this.db = null;
        this.auth = null;
        this.currentUser = null;
        this.listeners = new Map(); // Para guardar unsubscribe functions
        this.init();
    }

    /**
     * Inicializa Firebase
     */
    async init() {
        try {
            // Verificar que Firebase esté cargado
            if (typeof firebase === 'undefined') {
                console.warn('⚠️ Firebase no está cargado aún');
                return;
            }

            this.db = firebase.firestore();
            this.auth = firebase.auth();

            // Listener de autenticación
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    console.log('✅ Usuario autenticado en FirebaseIntegration:', user.email);
                }
            });

            console.log('✅ FirebaseIntegration inicializado');
        } catch (error) {
            console.error('❌ Error inicializando FirebaseIntegration:', error);
        }
    }

    /**
     * ========================================
     * INSCRIPCIONES Y PARTICIPACIONES
     * ========================================
     */

    /**
     * Guarda una nueva inscripción a certamen
     */
    async saveInscription(data) {
        try {
            if (!this.currentUser) {
                throw new Error('Usuario no autenticado');
            }

            const inscriptionData = {
                userId: this.currentUser.uid,
                userEmail: this.currentUser.email,
                userName: this.currentUser.displayName || this.currentUser.email,
                certamenId: data.certamenId,
                certamenNombre: data.certamenNombre,
                categoria: data.categoria,
                provincia: data.provincia || null,
                localidad: data.localidad || null,
                fechaInscripcion: firebase.firestore.FieldValue.serverTimestamp(),
                estado: 'activo',
                videoUrl: null,
                votos: 0,
                ranking: null
            };

            const docRef = await this.db.collection('participantes_online').add(inscriptionData);

            // Actualizar perfil de artista
            await this.updateArtistProfile({
                participaciones: firebase.firestore.FieldValue.increment(1)
            });

            console.log('✅ Inscripción guardada:', docRef.id);
            return { success: true, id: docRef.id };

        } catch (error) {
            console.error('❌ Error guardando inscripción:', error);
            throw error;
        }
    }

    /**
     * Guarda un nuevo video en participaciones
     */
    async saveVideoSubmission(videoData) {
        try {
            if (!this.currentUser) {
                throw new Error('Usuario no autenticado');
            }

            const submission = {
                userId: this.currentUser.uid,
                userEmail: this.currentUser.email,
                userName: this.currentUser.displayName || this.currentUser.email,
                videoUrl: videoData.videoUrl,
                videoId: videoData.videoId,
                titulo: videoData.titulo,
                descripcion: videoData.descripcion || '',
                categoria: videoData.categoria,
                fechaSubida: firebase.firestore.FieldValue.serverTimestamp(),
                estado: 'pendiente_revision',
                votos: 0,
                vistas: 0,
                comentarios: 0
            };

            const docRef = await this.db.collection('participaciones').add(submission);

            // Actualizar perfil de artista
            await this.updateArtistProfile({
                videosSubidos: firebase.firestore.FieldValue.increment(1)
            });

            console.log('✅ Video guardado:', docRef.id);
            return { success: true, id: docRef.id };

        } catch (error) {
            console.error('❌ Error guardando video:', error);
            throw error;
        }
    }

    /**
     * ========================================
     * VOTOS EN TIEMPO REAL
     * ========================================
     */

    /**
     * Lee los votos de un usuario en tiempo real
     */
    subscribeToUserVotes(userId, callback) {
        if (!this.db) {
            console.error('Firestore no inicializado');
            return null;
        }

        const unsubscribe = this.db.collection('participaciones')
            .where('userId', '==', userId)
            .onSnapshot((snapshot) => {
                let totalVotos = 0;
                const videos = [];

                snapshot.forEach(doc => {
                    const data = doc.data();
                    totalVotos += data.votos || 0;
                    videos.push({
                        id: doc.id,
                        ...data
                    });
                });

                callback({
                    totalVotos,
                    videos,
                    timestamp: new Date()
                });
            }, (error) => {
                console.error('Error en subscripción de votos:', error);
            });

        // Guardar para poder cancelar después
        this.listeners.set(`votes_${userId}`, unsubscribe);
        return unsubscribe;
    }

    /**
     * Lee los votos de una participación específica en tiempo real
     */
    subscribeToParticipationVotes(participationId, callback) {
        if (!this.db) return null;

        const unsubscribe = this.db.collection('participaciones')
            .doc(participationId)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    callback({
                        votos: doc.data().votos || 0,
                        vistas: doc.data().vistas || 0,
                        timestamp: new Date()
                    });
                }
            });

        this.listeners.set(`participation_${participationId}`, unsubscribe);
        return unsubscribe;
    }

    /**
     * Registra un voto
     */
    async registerVote(participationId, vytMoneyAmount) {
        try {
            if (!this.currentUser) {
                throw new Error('Usuario no autenticado');
            }

            // Verificar saldo
            const balance = await this.getVYTMoneyBalance();
            if (balance < vytMoneyAmount) {
                throw new Error('Saldo insuficiente de VYT Money');
            }

            // Usar transaction para atomicidad
            await this.db.runTransaction(async (transaction) => {
                const participationRef = this.db.collection('participaciones').doc(participationId);
                const moneyRef = this.db.collection('user_vyt_money').doc(this.currentUser.uid);

                const participationDoc = await transaction.get(participationRef);
                if (!participationDoc.exists) {
                    throw new Error('Participación no encontrada');
                }

                // Actualizar votos
                transaction.update(participationRef, {
                    votos: firebase.firestore.FieldValue.increment(1)
                });

                // Descontar VYT Money
                transaction.update(moneyRef, {
                    balance: firebase.firestore.FieldValue.increment(-vytMoneyAmount),
                    lastTransaction: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Registrar transacción
                const transactionRef = this.db.collection('transactions').doc();
                transaction.set(transactionRef, {
                    userId: this.currentUser.uid,
                    type: 'vote',
                    amount: vytMoneyAmount,
                    participationId: participationId,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            console.log('✅ Voto registrado exitosamente');
            return { success: true };

        } catch (error) {
            console.error('❌ Error registrando voto:', error);
            throw error;
        }
    }

    /**
     * ========================================
     * PERFIL DE ARTISTA
     * ========================================
     */

    /**
     * Vincula el usuario logueado con su perfil de artista
     */
    async linkUserToArtistProfile() {
        try {
            if (!this.currentUser) {
                throw new Error('Usuario no autenticado');
            }

            // Buscar perfil existente
            const profileSnapshot = await this.db.collection('artist_profiles')
                .where('userId', '==', this.currentUser.uid)
                .limit(1)
                .get();

            if (!profileSnapshot.empty) {
                // Perfil ya existe
                const profileId = profileSnapshot.docs[0].id;
                console.log('✅ Perfil de artista ya existe:', profileId);
                return { exists: true, profileId };
            }

            // Crear nuevo perfil
            const profileData = {
                userId: this.currentUser.uid,
                email: this.currentUser.email,
                displayName: this.currentUser.displayName || this.currentUser.email,
                photoURL: this.currentUser.photoURL || null,
                bio: '',
                categoria: null,
                provincia: null,
                localidad: null,
                redesSociales: {},
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
                totalVotos: 0,
                participaciones: 0,
                videosSubidos: 0,
                ranking: null,
                activo: true
            };

            const docRef = await this.db.collection('artist_profiles').add(profileData);

            console.log('✅ Perfil de artista creado:', docRef.id);
            return { exists: false, profileId: docRef.id };

        } catch (error) {
            console.error('❌ Error vinculando perfil de artista:', error);
            throw error;
        }
    }

    /**
     * Obtiene el perfil de artista del usuario actual
     */
    async getArtistProfile() {
        try {
            if (!this.currentUser) return null;

            const snapshot = await this.db.collection('artist_profiles')
                .where('userId', '==', this.currentUser.uid)
                .limit(1)
                .get();

            if (snapshot.empty) return null;

            return {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
            };

        } catch (error) {
            console.error('Error obteniendo perfil de artista:', error);
            return null;
        }
    }

    /**
     * Actualiza el perfil de artista
     */
    async updateArtistProfile(updates) {
        try {
            if (!this.currentUser) {
                throw new Error('Usuario no autenticado');
            }

            const profile = await this.getArtistProfile();
            
            if (!profile) {
                // Crear perfil si no existe
                await this.linkUserToArtistProfile();
                return await this.updateArtistProfile(updates);
            }

            await this.db.collection('artist_profiles')
                .doc(profile.id)
                .update({
                    ...updates,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });

            console.log('✅ Perfil de artista actualizado');
            return { success: true };

        } catch (error) {
            console.error('❌ Error actualizando perfil:', error);
            throw error;
        }
    }

    /**
     * ========================================
     * VYT MONEY
     * ========================================
     */

    /**
     * Obtiene el saldo de VYT Money del usuario
     */
    async getVYTMoneyBalance() {
        try {
            if (!this.currentUser) return 0;

            const doc = await this.db.collection('user_vyt_money')
                .doc(this.currentUser.uid)
                .get();

            if (!doc.exists) {
                // Crear documento con saldo inicial
                await this.db.collection('user_vyt_money')
                    .doc(this.currentUser.uid)
                    .set({
                        balance: 0,
                        userId: this.currentUser.uid,
                        email: this.currentUser.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                return 0;
            }

            return doc.data().balance || 0;

        } catch (error) {
            console.error('Error obteniendo saldo VYT Money:', error);
            return 0;
        }
    }

    /**
     * Suscripción en tiempo real al saldo de VYT Money
     */
    subscribeToVYTMoney(userId, callback) {
        if (!this.db) return null;

        const unsubscribe = this.db.collection('user_vyt_money')
            .doc(userId)
            .onSnapshot((doc) => {
                const balance = doc.exists ? (doc.data().balance || 0) : 0;
                callback(balance);
            });

        this.listeners.set(`vyt_money_${userId}`, unsubscribe);
        return unsubscribe;
    }

    /**
     * ========================================
     * ESTADÍSTICAS
     * ========================================
     */

    /**
     * Obtiene todas las estadísticas del usuario
     */
    async getUserStatistics(userId) {
        try {
            const [votos, ranking, vytMoney, videos] = await Promise.all([
                this.getUserTotalVotes(userId),
                this.getUserRanking(userId),
                this.getVYTMoneyBalance(),
                this.getUserVideos(userId)
            ]);

            return {
                votos: votos.total,
                votosSemana: votos.semana,
                ranking: ranking.position,
                rankingTotal: ranking.total,
                vytMoney: vytMoney,
                videos: videos
            };

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            throw error;
        }
    }

    /**
     * Obtiene el total de votos del usuario
     */
    async getUserTotalVotes(userId) {
        const snapshot = await this.db.collection('participaciones')
            .where('userId', '==', userId)
            .get();

        let total = 0;
        let semana = 0;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        snapshot.forEach(doc => {
            const data = doc.data();
            total += data.votos || 0;
            
            if (data.fechaSubida && data.fechaSubida.toDate() > oneWeekAgo) {
                semana += data.votos || 0;
            }
        });

        return { total, semana };
    }

    /**
     * Obtiene la posición en el ranking
     */
    async getUserRanking(userId) {
        const snapshot = await this.db.collection('artist_profiles')
            .orderBy('totalVotos', 'desc')
            .get();

        let position = 0;
        let found = false;

        snapshot.forEach((doc, index) => {
            if (doc.data().userId === userId) {
                position = index + 1;
                found = true;
            }
        });

        return {
            position: found ? position : null,
            total: snapshot.size
        };
    }

    /**
     * Obtiene los videos del usuario
     */
    async getUserVideos(userId, limit = 10) {
        const snapshot = await this.db.collection('participaciones')
            .where('userId', '==', userId)
            .orderBy('fechaSubida', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    /**
     * ========================================
     * UTILIDADES
     * ========================================
     */

    /**
     * Cancela todos los listeners activos
     */
    unsubscribeAll() {
        this.listeners.forEach((unsubscribe, key) => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
                console.log('🔌 Listener cancelado:', key);
            }
        });
        this.listeners.clear();
    }

    /**
     * Cancela un listener específico
     */
    unsubscribe(key) {
        const unsubscribe = this.listeners.get(key);
        if (unsubscribe && typeof unsubscribe === 'function') {
            unsubscribe();
            this.listeners.delete(key);
            console.log('🔌 Listener cancelado:', key);
        }
    }

    /**
     * Verifica si el usuario está autenticado
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Obtiene el usuario actual
     */
    getCurrentUser() {
        return this.currentUser;
    }
}

// Crear instancia global
if (typeof window !== 'undefined') {
    // Esperar a que Firebase esté listo
    const initFirebaseIntegration = () => {
        if (typeof firebase !== 'undefined') {
            window.FirebaseIntegration = new FirebaseIntegration();
            console.log('✅ FirebaseIntegration disponible globalmente');
        } else {
            console.warn('⚠️ Firebase no disponible, reintentando...');
            setTimeout(initFirebaseIntegration, 100);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFirebaseIntegration);
    } else {
        initFirebaseIntegration();
    }
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseIntegration;
}

// Cleanup al cerrar la página
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        if (window.FirebaseIntegration) {
            window.FirebaseIntegration.unsubscribeAll();
        }
    });
}

console.log('📦 Firebase Integration Module cargado');
