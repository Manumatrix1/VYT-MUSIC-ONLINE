/**
 * ================================================================
 * VYT MUSIC - Google Analytics 4
 * Tracking de eventos y conversiones
 * Fecha: 9 de Enero 2026
 * ================================================================
 */

// Configuración Google Analytics 4
// TODO: Reemplazar G-XXXXXXXXXX con tu Measurement ID real
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

// Cargar gtag.js dinámicamente
(function() {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
})();

// Inicializar dataLayer
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

  // Configuración básica
  gtag('config', 'G-XXXXXXXXXX', {
    'send_page_view': true,
    'anonymize_ip': true,
    'cookie_flags': 'SameSite=None;Secure'
  });

  // ================================================================
  // EVENTOS PERSONALIZADOS VYT MUSIC
  // ================================================================

  // Función para trackear inscripciones
  window.trackInscripcion = function(certamen, precio, provincia) {
    gtag('event', 'inscripcion_iniciada', {
      'event_category': 'Inscripcion',
      'event_label': certamen,
      'value': precio,
      'provincia': provincia
    });
  };

  // Función para trackear pagos exitosos
  window.trackPagoExitoso = function(monto, tipo) {
    gtag('event', 'purchase', {
      'transaction_id': Date.now().toString(),
      'value': monto,
      'currency': 'ARS',
      'items': [{
        'item_name': tipo,
        'price': monto,
        'quantity': 1
      }]
    });
  };

  // Función para trackear compra de VYT Money
  window.trackCompraVYTMoney = function(paquete, monto) {
    gtag('event', 'compra_vyt_money', {
      'event_category': 'Monetizacion',
      'event_label': paquete,
      'value': monto
    });
  };

  // Función para trackear registro de usuarios
  window.trackRegistro = function(tipoUsuario) {
    gtag('event', 'sign_up', {
      'method': 'email',
      'user_type': tipoUsuario
    });
  };

  // Función para trackear login
  window.trackLogin = function(metodo, tipoUsuario) {
    gtag('event', 'login', {
      'method': metodo,
      'user_type': tipoUsuario
    });
  };

  // Función para trackear votaciones
  window.trackVotacion = function(artistaId, vytMoneyGastado) {
    gtag('event', 'votacion', {
      'event_category': 'Engagement',
      'event_label': artistaId,
      'value': vytMoneyGastado
    });
  };

  // Función para trackear visualizaciones de perfil
  window.trackVisualizacionPerfil = function(tipoUsuario) {
    gtag('event', 'page_view', {
      'page_title': 'Perfil de ' + tipoUsuario,
      'page_location': window.location.href
    });
  };

  // ================================================================
  // EVENTOS AUTOMÁTICOS
  // ================================================================

  // Trackear clicks en botones importantes
  document.addEventListener('DOMContentLoaded', function() {
    // Botones de inscripción
    const btnInscripcion = document.querySelectorAll('[data-track="inscripcion"]');
    btnInscripcion.forEach(btn => {
      btn.addEventListener('click', () => {
        gtag('event', 'click_inscripcion', {
          'event_category': 'CTA',
          'event_label': btn.textContent
        });
      });
    });

    // Botones de compra VYT Money
    const btnComprar = document.querySelectorAll('[data-track="comprar"]');
    btnComprar.forEach(btn => {
      btn.addEventListener('click', () => {
        gtag('event', 'click_comprar_vyt_money', {
          'event_category': 'CTA',
          'event_label': btn.textContent
        });
      });
    });

    // Trackear scroll depth
    let scrollDepth = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
      
      if (currentScroll > scrollDepth) {
        scrollDepth = currentScroll;
        
        if (scrollDepth >= 25 && scrollDepth < 50) {
          gtag('event', 'scroll', {
            'event_category': 'Engagement',
            'event_label': '25%'
          });
        } else if (scrollDepth >= 50 && scrollDepth < 75) {
          gtag('event', 'scroll', {
            'event_category': 'Engagement',
            'event_label': '50%'
          });
        } else if (scrollDepth >= 75 && scrollDepth < 90) {
          gtag('event', 'scroll', {
            'event_category': 'Engagement',
            'event_label': '75%'
          });
        } else if (scrollDepth >= 90) {
          gtag('event', 'scroll', {
            'event_category': 'Engagement',
            'event_label': '100%'
          });
        }
      }
    });
  });

  console.log('✅ Google Analytics 4 inicializado');

/**
 * ================================================================
 * INSTRUCCIONES DE IMPLEMENTACIÓN:
 * 
 * 1. Reemplazar G-XXXXXXXXXX con tu ID real de GA4
 * 
 * 2. Agregar en el <head> de TODAS las páginas:
 *    <script src="/src/google-analytics.js"></script>
 * 
 * 3. Usar funciones de tracking en tu código:
 *    - trackInscripcion(certamen, precio, provincia)
 *    - trackPagoExitoso(monto, tipo)
 *    - trackCompraVYTMoney(paquete, monto)
 *    - trackRegistro(tipoUsuario)
 *    - trackLogin(metodo, tipoUsuario)
 *    - trackVotacion(artistaId, vytMoneyGastado)
 * 
 * 4. Agregar data-track="inscripcion" a botones importantes
 * 
 * EJEMPLO:
 * <button data-track="inscripcion" onclick="irAInscripcion()">
 *   Inscribirme Ahora
 * </button>
 * 
 * ================================================================
 */
