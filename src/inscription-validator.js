/**
 * 🎵 VYT MUSIC - Sistema de Validación de Inscripciones
 * Validador completo para formularios de inscripción
 */

class InscriptionValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Validar nombre de artista
     * @param {string} name - Nombre a validar
     * @returns {boolean} Es válido
     */
    validateArtistName(name) {
        if (!name || name.trim().length < 2) {
            this.addError('El nombre de artista debe tener al menos 2 caracteres');
            return false;
        }
        
        if (name.length > 50) {
            this.addError('El nombre de artista no puede superar los 50 caracteres');
            return false;
        }

        // Verificar caracteres especiales excesivos
        const specialCharsPattern = /[^a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\-'\.]/g;
        if (specialCharsPattern.test(name)) {
            this.addError('El nombre contiene caracteres no permitidos');
            return false;
        }

        return true;
    }

    /**
     * Validar email con verificación avanzada
     * @param {string} email - Email a validar
     * @returns {boolean} Es válido
     */
    validateEmail(email) {
        if (!email) {
            this.addError('El email es requerido');
            return false;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            this.addError('El formato del email no es válido');
            return false;
        }

        // Validar dominios comunes
        const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com'];
        const domain = email.split('@')[1].toLowerCase();
        
        if (email.length > 100) {
            this.addError('El email es demasiado largo');
            return false;
        }

        return true;
    }

    /**
     * Validar confirmación de email
     * @param {string} email - Email original
     * @param {string} confirmEmail - Email confirmación
     * @returns {boolean} Es válido
     */
    validateEmailConfirmation(email, confirmEmail) {
        if (email !== confirmEmail) {
            this.addError('Los emails no coinciden');
            return false;
        }
        return true;
    }

    /**
     * Validar número de WhatsApp
     * @param {string} whatsapp - Número a validar
     * @returns {boolean} Es válido
     */
    validateWhatsApp(whatsapp) {
        if (!whatsapp) {
            this.addError('El número de WhatsApp es requerido');
            return false;
        }

        // Remover espacios y caracteres especiales
        const cleanNumber = whatsapp.replace(/[\s\-\(\)]/g, '');
        
        // Validar formato argentino
        const argentinaRegex = /^54(?:11|[2-4]\d)[0-9]{8}$/;
        const internationalRegex = /^[1-9]\d{1,14}$/;
        
        if (!argentinaRegex.test(cleanNumber) && !internationalRegex.test(cleanNumber)) {
            this.addError('El formato del número de WhatsApp no es válido. Ejemplo: 5491112345678');
            return false;
        }

        return true;
    }

    /**
     * Validar video URL (YouTube, TikTok, etc.)
     * @param {string} url - URL a validar
     * @returns {object} Resultado con tipo de plataforma
     */
    validateVideoURL(url) {
        if (!url) {
            this.addError('El enlace del video es requerido');
            return { valid: false };
        }

        const patterns = {
            youtube: /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            tiktok: /^(https?:\/\/)?(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/,
            instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel)\/[\w-]+/,
            facebook: /^(https?:\/\/)?(www\.)?facebook\.com.+\/videos?\//
        };

        for (const [platform, pattern] of Object.entries(patterns)) {
            if (pattern.test(url)) {
                return { valid: true, platform };
            }
        }

        this.addError('El enlace debe ser de YouTube, TikTok, Instagram o Facebook');
        return { valid: false };
    }

    /**
     * Validar archivo de imagen
     * @param {File} file - Archivo a validar
     * @returns {boolean} Es válido
     */
    validateImageFile(file) {
        if (!file) {
            this.addError('La foto del artista es requerida');
            return false;
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.addError('La foto debe ser JPG, PNG o WEBP');
            return false;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            this.addError('La foto no puede superar los 5MB');
            return false;
        }

        return true;
    }

    /**
     * Validar edad
     * @param {number} age - Edad a validar
     * @returns {boolean} Es válido
     */
    validateAge(age) {
        if (!age || age < 16) {
            this.addError('Debes tener al menos 16 años para participar');
            return false;
        }

        if (age > 80) {
            this.addWarning('Edad poco común, por favor verifica');
        }

        return true;
    }

    /**
     * Validar selección de certamen
     * @param {string} certamenId - ID del certamen
     * @returns {boolean} Es válido
     */
    validateCertamen(certamenId) {
        if (!certamenId) {
            this.addError('Debes seleccionar un certamen');
            return false;
        }
        return true;
    }

    /**
     * Validar aceptación de términos
     * @param {boolean} accepted - Si acepta términos
     * @returns {boolean} Es válido
     */
    validateTermsAcceptance(accepted) {
        if (!accepted) {
            this.addError('Debes aceptar los términos y condiciones');
            return false;
        }
        return true;
    }

    /**
     * Agregar error
     * @param {string} message - Mensaje de error
     */
    addError(message) {
        this.errors.push(message);
    }

    /**
     * Agregar advertencia
     * @param {string} message - Mensaje de advertencia
     */
    addWarning(message) {
        this.warnings.push(message);
    }

    /**
     * Obtener errores
     * @returns {Array} Lista de errores
     */
    getErrors() {
        return this.errors;
    }

    /**
     * Obtener advertencias
     * @returns {Array} Lista de advertencias
     */
    getWarnings() {
        return this.warnings;
    }

    /**
     * Verificar si hay errores
     * @returns {boolean} Tiene errores
     */
    hasErrors() {
        return this.errors.length > 0;
    }

    /**
     * Limpiar errores y advertencias
     */
    clear() {
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Validar formulario completo de inscripción online
     * @param {Object} formData - Datos del formulario
     * @returns {Object} Resultado de validación
     */
    validateOnlineForm(formData) {
        this.clear();

        const {
            nombre,
            email,
            confirmEmail,
            whatsapp,
            provincia,
            video,
            foto,
            certamenId,
            acceptsTerms
        } = formData;

        // Validaciones
        this.validateArtistName(nombre);
        this.validateEmail(email);
        this.validateEmailConfirmation(email, confirmEmail);
        this.validateWhatsApp(whatsapp);
        this.validateVideoURL(video);
        this.validateImageFile(foto);
        this.validateCertamen(certamenId);
        this.validateTermsAcceptance(acceptsTerms);

        if (!provincia) {
            this.addError('Debes seleccionar tu provincia');
        }

        return {
            isValid: !this.hasErrors(),
            errors: this.getErrors(),
            warnings: this.getWarnings()
        };
    }

    /**
     * Validar formulario completo de inscripción presencial
     * @param {Object} formData - Datos del formulario
     * @returns {Object} Resultado de validación
     */
    validatePresencialForm(formData) {
        this.clear();

        const {
            nombre,
            edad,
            email,
            confirmEmail,
            telefono,
            video,
            acceptsTerms
        } = formData;

        // Validaciones
        this.validateArtistName(nombre);
        this.validateAge(parseInt(edad));
        this.validateEmail(email);
        this.validateEmailConfirmation(email, confirmEmail);
        this.validateWhatsApp(telefono);
        this.validateVideoURL(video);
        this.validateTermsAcceptance(acceptsTerms);

        return {
            isValid: !this.hasErrors(),
            errors: this.getErrors(),
            warnings: this.getWarnings()
        };
    }
}

// Clase para manejar UI de validación
class ValidationUI {
    constructor(validator) {
        this.validator = validator;
    }

    /**
     * Mostrar errores en el UI
     * @param {Array} errors - Lista de errores
     * @param {string} containerId - ID del contenedor
     */
    displayErrors(errors, containerId = 'validation-errors') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (errors.length === 0) {
            container.innerHTML = '';
            container.classList.add('hidden');
            return;
        }

        const errorHtml = `
            <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
                <div class="flex items-center mb-2">
                    <i class="fas fa-exclamation-triangle text-red-400 mr-2"></i>
                    <h4 class="text-red-300 font-semibold">Corrige los siguientes errores:</h4>
                </div>
                <ul class="list-disc list-inside text-red-200 text-sm space-y-1">
                    ${errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            </div>
        `;

        container.innerHTML = errorHtml;
        container.classList.remove('hidden');
        container.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Mostrar advertencias en el UI
     * @param {Array} warnings - Lista de advertencias
     * @param {string} containerId - ID del contenedor
     */
    displayWarnings(warnings, containerId = 'validation-warnings') {
        const container = document.getElementById(containerId);
        if (!container || warnings.length === 0) return;

        const warningHtml = `
            <div class="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
                <div class="flex items-center mb-2">
                    <i class="fas fa-exclamation text-yellow-400 mr-2"></i>
                    <h4 class="text-yellow-300 font-semibold">Advertencias:</h4>
                </div>
                <ul class="list-disc list-inside text-yellow-200 text-sm space-y-1">
                    ${warnings.map(warning => `<li>${warning}</li>`).join('')}
                </ul>
            </div>
        `;

        container.innerHTML = warningHtml;
        container.classList.remove('hidden');
    }

    /**
     * Limpiar mensajes de validación
     */
    clearMessages() {
        ['validation-errors', 'validation-warnings'].forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = '';
                container.classList.add('hidden');
            }
        });
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.InscriptionValidator = InscriptionValidator;
    window.ValidationUI = ValidationUI;
}