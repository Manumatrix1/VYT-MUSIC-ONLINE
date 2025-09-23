// === SISTEMA DE GAMIFICACIÓN VYT MUSIC ===

class VYTGamification {
    constructor() {
        this.prizePool = 750000;
        this.participants = 485;
        this.totalVotes = 127346;
        this.vytMoneySpent = 1247890;
        this.isAnimating = false;
        this.init();
    }

    init() {
        this.createFloatingCoins();
        this.startPrizePoolAnimation();
        this.initializeAudioSystem();
        this.loadRealDataFromFirebase();
        this.setupMobileOptimizations();
    }

    // === SISTEMA DE MONEDAS FLOTANTES ===
    createFloatingCoins() {
        setInterval(() => {
            if (Math.random() < 0.3) {
                this.spawnCoin();
            }
        }, 2000);
    }

    spawnCoin() {
        const coin = document.createElement('div');
        coin.className = 'coin-float';
        coin.style.left = Math.random() * 100 + 'vw';
        coin.style.animationDuration = (Math.random() * 2 + 3) + 's';
        coin.style.animationDelay = Math.random() * 1 + 's';
        
        // Crear contenedor si no existe
        let container = document.getElementById('floating-coins');
        if (!container) {
            container = document.createElement('div');
            container.id = 'floating-coins';
            container.className = 'floating-coins';
            document.body.appendChild(container);
        }
        
        container.appendChild(coin);
        
        // Remover después de la animación
        setTimeout(() => {
            if (coin.parentNode) {
                coin.parentNode.removeChild(coin);
            }
        }, 5000);
    }

    // === EFECTOS DE EXPLOSIÓN DE PARTÍCULAS ===
    createParticleExplosion(x, y, count = 10) {
        const explosion = document.createElement('div');
        explosion.className = 'particle-explosion';
        explosion.style.left = x + 'px';
        explosion.style.top = y + 'px';
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const randomX = (Math.random() - 0.5) * 200;
            const randomY = (Math.random() - 0.5) * 200;
            
            particle.style.setProperty('--random-x', randomX + 'px');
            particle.style.setProperty('--random-y', randomY + 'px');
            particle.style.animationDelay = Math.random() * 0.3 + 's';
            
            explosion.appendChild(particle);
        }
        
        document.body.appendChild(explosion);
        
        setTimeout(() => {
            document.body.removeChild(explosion);
        }, 1000);
    }

    // === ANIMACIÓN DEL POZO DE PREMIOS ===
    startPrizePoolAnimation() {
        setInterval(() => {
            this.updatePrizePool();
        }, 5000);
    }

    updatePrizePool() {
        const increment = Math.floor(Math.random() * 1000) + 100;
        this.prizePool += increment;
        
        const poolAmountElement = document.getElementById('poolAmount');
        const poolIncrementElement = document.getElementById('poolIncrement');
        
        if (poolAmountElement) {
            poolAmountElement.textContent = '$' + this.prizePool.toLocaleString();
            
            // Mostrar incremento
            if (poolIncrementElement) {
                poolIncrementElement.textContent = '+$' + increment;
                poolIncrementElement.style.animation = 'none';
                poolIncrementElement.offsetHeight; // Trigger reflow
                poolIncrementElement.style.animation = 'increment-popup 2s ease-out';
            }
            
            // Crear explosión de partículas
            const rect = poolAmountElement.getBoundingClientRect();
            this.createParticleExplosion(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                5
            );
        }
        
        // Actualizar progreso
        this.updateProgress();
        
        // Reproducir sonido de monedas
        this.playSound('coin');
    }

    updateProgress() {
        const progressFill = document.getElementById('poolProgressFill');
        const percentage = document.getElementById('poolPercentage');
        
        if (progressFill && percentage) {
            const targetAmount = 500000;
            const currentPercentage = Math.min((this.prizePool / targetAmount) * 100, 150);
            
            progressFill.style.width = currentPercentage + '%';
            percentage.textContent = Math.round(currentPercentage) + '%';
        }
    }

    // === SISTEMA DE AUDIO ===
    initializeAudioSystem() {
        this.audioContext = null;
        this.sounds = {};
        
        // Crear contexto de audio solo cuando el usuario interactúe
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.createAudioBuffers();
            }
        }, { once: true });
    }

    createAudioBuffers() {
        // Crear sonidos sintéticos para evitar archivos externos
        this.sounds.coin = this.createCoinSound();
        this.sounds.vote = this.createVoteSound();
        this.sounds.levelUp = this.createLevelUpSound();
    }

    createCoinSound() {
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const time = i / sampleRate;
            data[i] = Math.sin(2 * Math.PI * (800 + 400 * Math.exp(-time * 10)) * time) * Math.exp(-time * 5);
        }
        
        return buffer;
    }

    createVoteSound() {
        const duration = 0.2;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const time = i / sampleRate;
            data[i] = Math.sin(2 * Math.PI * 600 * time) * Math.exp(-time * 8) * 0.3;
        }
        
        return buffer;
    }

    createLevelUpSound() {
        const duration = 0.8;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const time = i / sampleRate;
            const freq = 400 + 200 * time;
            data[i] = Math.sin(2 * Math.PI * freq * time) * Math.exp(-time * 2) * 0.5;
        }
        
        return buffer;
    }

    playSound(soundName) {
        if (!this.audioContext || !this.sounds[soundName]) return;
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.sounds[soundName];
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        source.start();
    }

    // === CONEXIÓN CON FIREBASE ===
    async loadRealDataFromFirebase() {
        try {
            if (typeof db === 'undefined') {
                console.warn('Firebase no está disponible, usando datos simulados');
                return;
            }

            // Cargar participantes
            const participantesSnapshot = await db.collection('participantes_online').get();
            this.participants = participantesSnapshot.size;
            
            // Cargar transacciones VYT Money
            const transactionsSnapshot = await db.collection('vyt_money_transactions').get();
            this.vytMoneySpent = 0;
            transactionsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.amount) {
                    this.vytMoneySpent += data.amount;
                }
            });
            
            // Actualizar UI con datos reales
            this.updateUIWithRealData();
            
        } catch (error) {
            console.error('Error cargando datos de Firebase:', error);
        }
    }

    updateUIWithRealData() {
        const participantElement = document.getElementById('participantCount');
        const vytMoneyElement = document.getElementById('vytMoneySpent');
        
        if (participantElement) {
            participantElement.textContent = this.participants;
        }
        
        if (vytMoneyElement) {
            vytMoneyElement.textContent = this.vytMoneySpent.toLocaleString();
        }
    }

    // === SISTEMA DE VOTACIÓN GAMIFICADO ===
    vote(artistId, amount = 1) {
        // Crear efecto visual de voto
        this.createVoteEffect();
        
        // Reproducir sonido
        this.playSound('vote');
        
        // Hacer monedas aparecer
        for (let i = 0; i < amount; i++) {
            setTimeout(() => {
                this.spawnCoin();
            }, i * 200);
        }
        
        // Actualizar el pozo (simulación)
        this.prizePool += amount * 10;
        this.updatePrizePool();
        
        return true;
    }

    createVoteEffect() {
        const effect = document.createElement('div');
        effect.textContent = '🗳️ +1 VOTO';
        effect.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ffd700;
            font-size: 2rem;
            font-weight: bold;
            pointer-events: none;
            z-index: 10000;
            animation: vote-effect 2s ease-out forwards;
        `;
        
        // Agregar keyframes si no existen
        if (!document.getElementById('vote-effect-styles')) {
            const style = document.createElement('style');
            style.id = 'vote-effect-styles';
            style.textContent = `
                @keyframes vote-effect {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -150%) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            document.body.removeChild(effect);
        }, 2000);
    }

    // === OPTIMIZACIONES MOBILE ===
    setupMobileOptimizations() {
        // Reducir efectos en dispositivos móviles
        if (window.innerWidth <= 768) {
            // Menos monedas flotantes
            this.reducedCoinSpawning = true;
            
            // Simplificar animaciones
            const styleSheet = document.createElement('style');
            styleSheet.textContent = `
                .dynamic-prize-pool {
                    animation: none;
                }
                .pool-progress-fill {
                    animation: none;
                }
                .coin-float {
                    animation-duration: 2s !important;
                }
            `;
            document.head.appendChild(styleSheet);
        }
    }

    // === RANKING DINÁMICO ===
    updateRanking(artists) {
        const rankingContainer = document.getElementById('ranking-list');
        if (!rankingContainer) return;
        
        rankingContainer.innerHTML = '';
        
        artists.forEach((artist, index) => {
            const artistCard = this.createArtistCard(artist, index + 1);
            rankingContainer.appendChild(artistCard);
        });
    }

    createArtistCard(artist, position) {
        const card = document.createElement('div');
        card.className = 'artist-card';
        
        const positionClass = position <= 3 ? `position-${position}` : '';
        
        card.innerHTML = `
            <div class="artist-position ${positionClass}">#${position}</div>
            <img src="${artist.avatar || 'https://via.placeholder.com/80'}" alt="${artist.name}" class="artist-avatar">
            <div class="artist-info">
                <div class="artist-name">${artist.name}</div>
                <div class="artist-genre">${artist.genre || 'Sin género'}</div>
                <div class="artist-stats">
                    <span class="stat-badge">🗳️ ${artist.votes || 0} votos</span>
                    <span class="stat-badge">💰 ${artist.vytMoney || 0} VYT</span>
                    <span class="stat-badge">⭐ Nivel ${artist.level || 1}</span>
                </div>
            </div>
            <button class="vote-button" onclick="vytGamification.vote('${artist.id}')">
                Votar
                <div class="sound-wave">
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                    <div class="wave-bar"></div>
                </div>
            </button>
        `;
        
        return card;
    }

    // === EFECTOS DE PANTALLA COMPLETA ===
    showLevelUpEffect(newLevel) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            animation: level-up-overlay 3s ease-out forwards;
        `;
        
        overlay.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 1rem;">🎉</div>
            <div style="font-size: 2.5rem; color: #ffd700; font-weight: bold; margin-bottom: 1rem;">
                ¡NIVEL ${newLevel}!
            </div>
            <div style="font-size: 1.2rem; color: white;">
                ¡Has desbloqueado nuevas funciones!
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Reproducir sonido de level up
        this.playSound('levelUp');
        
        // Crear explosión masiva de partículas
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createParticleExplosion(
                    Math.random() * window.innerWidth,
                    Math.random() * window.innerHeight,
                    3
                );
            }, i * 50);
        }
        
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 3000);
    }
}

// === INICIALIZACIÓN ===
let vytGamification;

document.addEventListener('DOMContentLoaded', () => {
    vytGamification = new VYTGamification();
    
    // Agregar listeners para botones de voto
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('vote-button')) {
            e.preventDefault();
            // El onclick ya maneja la votación
        }
    });
});

// === FUNCIONES GLOBALES PARA USO EXTERNO ===
window.vytGamification = {
    vote: (artistId, amount) => vytGamification?.vote(artistId, amount),
    showLevelUp: (level) => vytGamification?.showLevelUpEffect(level),
    spawnCoin: () => vytGamification?.spawnCoin(),
    updateRanking: (artists) => vytGamification?.updateRanking(artists)
};