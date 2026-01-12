/**
 * VYT MUSIC - SISTEMA DE GAMIFICACIÓN
 * Efectos visuales, partículas, animaciones dinámicas
 */

(function() {
    'use strict';

    /**
     * Crear partículas flotantes en el hero
     */
    function createParticles(container, count = 30) {
        const particlesDiv = document.createElement('div');
        particlesDiv.className = 'particles';
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Posición aleatoria
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            
            // Variables CSS para animación
            particle.style.setProperty('--tx', (Math.random() - 0.5) * 200 + 'px');
            particle.style.setProperty('--ty', (Math.random() - 0.5) * 200 + 'px');
            
            // Delay aleatorio
            particle.style.animationDelay = Math.random() * 8 + 's';
            particle.style.animationDuration = (Math.random() * 5 + 5) + 's';
            
            particlesDiv.appendChild(particle);
        }
        
        container.appendChild(particlesDiv);
    }

    /**
     * Efecto parallax en scroll
     */
    function initParallax() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach(el => {
                const speed = el.dataset.parallax || 0.5;
                const yPos = -(scrolled * speed);
                el.style.transform = `translateY(${yPos}px)`;
            });
        });
    }

    /**
     * Contador animado para números
     */
    function animateCounter(element, start, end, duration = 2000) {
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (end - start) * easeOut);
            
            element.textContent = current.toLocaleString('es-AR');
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }

    /**
     * Inicializar contadores cuando entran en viewport
     */
    function initCounters() {
        const counters = document.querySelectorAll('[data-counter]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.counted) {
                    const target = parseInt(entry.target.dataset.counter);
                    animateCounter(entry.target, 0, target);
                    entry.target.dataset.counted = 'true';
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => observer.observe(counter));
    }

    /**
     * Progress bar animado
     */
    function animateProgressBar(bar, targetPercent) {
        bar.style.width = '0%';
        
        setTimeout(() => {
            bar.style.width = targetPercent + '%';
        }, 100);
    }

    /**
     * Inicializar progress bars con Intersection Observer
     */
    function initProgressBars() {
        const progressBars = document.querySelectorAll('.progress-bar[data-progress]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.animated) {
                    const percent = parseInt(entry.target.dataset.progress);
                    animateProgressBar(entry.target, percent);
                    entry.target.dataset.animated = 'true';
                }
            });
        }, { threshold: 0.5 });
        
        progressBars.forEach(bar => observer.observe(bar));
    }

    /**
     * Efecto de escritura tipo máquina
     */
    function typeWriter(element, text, speed = 50) {
        let i = 0;
        element.textContent = '';
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        
        type();
    }

    /**
     * Shake effect para elementos (errores, validaciones)
     */
    function shake(element) {
        element.style.animation = 'none';
        setTimeout(() => {
            element.style.animation = 'shake 0.5s';
        }, 10);
    }

    /**
     * Confetti cuando se completa algo importante
     */
    function launchConfetti() {
        const colors = ['#58a6ff', '#FFD700', '#2bb7d1', '#40c057'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: -10px;
                left: ${Math.random() * 100}vw;
                opacity: 1;
                pointer-events: none;
                z-index: 9999;
                animation: confetti-fall ${Math.random() * 2 + 2}s linear forwards;
            `;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 4000);
        }
    }

    /**
     * Efecto ripple en clicks (Material Design)
     */
    function addRippleEffect(button) {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                top: ${y}px;
                left: ${x}px;
                pointer-events: none;
                animation: ripple 0.6s ease-out;
            `;
            
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    }

    /**
     * Hover 3D efecto en cards
     */
    function init3DCardEffect(card) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    }

    /**
     * Scroll reveal - mostrar elementos al hacer scroll
     */
    function initScrollReveal() {
        const reveals = document.querySelectorAll('.fade-in-up, .reveal');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, { 
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        reveals.forEach(reveal => observer.observe(reveal));
    }

    /**
     * Badges animados (nuevo, popular, etc)
     */
    function addFloatingBadge(container, text, type = 'new') {
        const badge = document.createElement('div');
        badge.className = `floating-badge badge-${type}`;
        badge.textContent = text;
        badge.style.cssText = `
            position: absolute;
            top: -10px;
            right: -10px;
            padding: 6px 12px;
            background: linear-gradient(135deg, #ff6b6b, #fa5252);
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            animation: bounce-in 0.5s ease-out, float 3s ease-in-out infinite;
            z-index: 10;
        `;
        
        if (type === 'popular') {
            badge.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
        } else if (type === 'hot') {
            badge.style.background = 'linear-gradient(135deg, #ff6b6b, #fa5252)';
        }
        
        container.style.position = 'relative';
        container.appendChild(badge);
    }

    /**
     * Sistema de notificaciones toast
     */
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? '#40c057' : type === 'error' ? '#ff6b6b' : '#58a6ff'};
            color: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slide-up 0.3s ease-out;
            font-weight: 600;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slide-up 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Inicialización automática
     */
    function autoInit() {
        // Crear partículas en hero
        const hero = document.querySelector('.hero-animated, .hero');
        if (hero) {
            createParticles(hero);
        }

        // Inicializar efectos
        initParallax();
        initCounters();
        initProgressBars();
        initScrollReveal();

        // Agregar ripple a botones
        document.querySelectorAll('.btn-game, .btn-primary').forEach(btn => {
            addRippleEffect(btn);
        });

        // 3D effect en cards
        document.querySelectorAll('.certamen-card, .card-3d').forEach(card => {
            init3DCardEffect(card);
        });

        // Agregar animación CSS de confetti
        const style = document.createElement('style');
        style.textContent = `
            @keyframes confetti-fall {
                to {
                    transform: translateY(100vh) rotate(360deg);
                    opacity: 0;
                }
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
            @keyframes ripple {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * API pública
     */
    window.VYTGamification = {
        createParticles,
        initParallax,
        animateCounter,
        animateProgressBar,
        typeWriter,
        shake,
        launchConfetti,
        showToast,
        addFloatingBadge,
        init3DCardEffect
    };

    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }

})();
