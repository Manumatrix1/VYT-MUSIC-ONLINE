/**
 * 🚀 VYT MUSIC - Utilidades de Rendimiento
 * Herramientas para optimizar el rendimiento de la aplicación
 */

// Cache inteligente con expiración
export class SmartCache {
    constructor(defaultTTL = 300000) { // 5 minutos por defecto
        this.cache = new Map();
        this.defaultTTL = defaultTTL;
    }
    
    set(key, value, ttl = this.defaultTTL) {
        const expiration = Date.now() + ttl;
        this.cache.set(key, { value, expiration });
        
        // Limpiar cache expirado después de establecer el nuevo valor
        this.cleanup();
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiration) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    has(key) {
        return this.get(key) !== null;
    }
    
    delete(key) {
        return this.cache.delete(key);
    }
    
    clear() {
        this.cache.clear();
    }
    
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiration) {
                this.cache.delete(key);
            }
        }
    }
    
    size() {
        this.cleanup();
        return this.cache.size;
    }
}

// Debouncer para funciones que se ejecutan frecuentemente
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle para funciones que necesitan ejecutarse pero con límite
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Lazy loader para componentes
export class LazyLoader {
    constructor() {
        this.loadedModules = new Map();
    }
    
    async load(modulePath) {
        if (this.loadedModules.has(modulePath)) {
            return this.loadedModules.get(modulePath);
        }
        
        try {
            const module = await import(modulePath);
            this.loadedModules.set(modulePath, module);
            return module;
        } catch (error) {
            console.warn(`⚠️ No se pudo cargar el módulo: ${modulePath}`, error);
            return null;
        }
    }
    
    preload(modulePaths) {
        return Promise.allSettled(
            modulePaths.map(path => this.load(path))
        );
    }
}

// Observer de rendimiento
export class PerformanceMonitor {
    constructor() {
        this.marks = new Map();
        this.measurements = [];
    }
    
    mark(name) {
        const timestamp = performance.now();
        this.marks.set(name, timestamp);
        console.log(`🔖 Marca: ${name} - ${timestamp.toFixed(2)}ms`);
    }
    
    measure(name, startMark, endMark = null) {
        const startTime = this.marks.get(startMark);
        const endTime = endMark ? this.marks.get(endMark) : performance.now();
        
        if (startTime === undefined) {
            console.warn(`⚠️ Marca de inicio '${startMark}' no encontrada`);
            return null;
        }
        
        const duration = endTime - startTime;
        const measurement = { name, duration, timestamp: Date.now() };
        this.measurements.push(measurement);
        
        console.log(`📊 Medición: ${name} - ${duration.toFixed(2)}ms`);
        return measurement;
    }
    
    getAverageTime(measurementName) {
        const measurements = this.measurements.filter(m => m.name === measurementName);
        if (measurements.length === 0) return null;
        
        const total = measurements.reduce((sum, m) => sum + m.duration, 0);
        return total / measurements.length;
    }
    
    report() {
        console.group('📈 Reporte de Rendimiento');
        
        const uniqueNames = [...new Set(this.measurements.map(m => m.name))];
        uniqueNames.forEach(name => {
            const avg = this.getAverageTime(name);
            const count = this.measurements.filter(m => m.name === name).length;
            console.log(`${name}: ${avg.toFixed(2)}ms promedio (${count} mediciones)`);
        });
        
        console.groupEnd();
    }
}

// Gestor de recursos críticos
export class ResourceManager {
    constructor() {
        this.criticalResources = new Set();
        this.preloadQueue = [];
        this.loadingPromises = new Map();
    }
    
    markCritical(resourcePath) {
        this.criticalResources.add(resourcePath);
    }
    
    async preloadCritical() {
        const criticalPromises = Array.from(this.criticalResources).map(resource => {
            return this.loadResource(resource);
        });
        
        try {
            await Promise.all(criticalPromises);
            console.log('✅ Recursos críticos precargados');
        } catch (error) {
            console.error('❌ Error precargando recursos críticos:', error);
        }
    }
    
    async loadResource(path) {
        if (this.loadingPromises.has(path)) {
            return this.loadingPromises.get(path);
        }
        
        const promise = this.actuallyLoadResource(path);
        this.loadingPromises.set(path, promise);
        
        return promise;
    }
    
    async actuallyLoadResource(path) {
        // Determinar tipo de recurso y cargarlo apropiadamente
        if (path.endsWith('.js')) {
            return import(path);
        } else if (path.endsWith('.css')) {
            return this.loadCSS(path);
        } else if (path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return this.loadImage(path);
        }
        
        throw new Error(`Tipo de recurso no soportado: ${path}`);
    }
    
    loadCSS(path) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = path;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }
    
    loadImage(path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = path;
        });
    }
}

// Optimizador de consultas a Firebase
export class FirebaseQueryOptimizer {
    constructor() {
        this.cache = new SmartCache();
        this.batchQueue = [];
        this.batchTimeout = null;
    }
    
    // Cache inteligente para consultas
    async cachedQuery(queryKey, queryFunction, ttl = 300000) {
        const cached = this.cache.get(queryKey);
        if (cached) {
            console.log(`📦 Cache hit: ${queryKey}`);
            return cached;
        }
        
        console.log(`🔍 Ejecutando consulta: ${queryKey}`);
        const result = await queryFunction();
        this.cache.set(queryKey, result, ttl);
        
        return result;
    }
    
    // Agrupar consultas para ejecutar en lote
    batchQuery(queryFunction) {
        return new Promise((resolve, reject) => {
            this.batchQueue.push({ queryFunction, resolve, reject });
            
            if (!this.batchTimeout) {
                this.batchTimeout = setTimeout(() => {
                    this.executeBatch();
                }, 50); // Esperar 50ms para agrupar consultas
            }
        });
    }
    
    async executeBatch() {
        const batch = [...this.batchQueue];
        this.batchQueue.length = 0;
        this.batchTimeout = null;
        
        console.log(`🔄 Ejecutando lote de ${batch.length} consultas`);
        
        try {
            const results = await Promise.allSettled(
                batch.map(item => item.queryFunction())
            );
            
            batch.forEach((item, index) => {
                const result = results[index];
                if (result.status === 'fulfilled') {
                    item.resolve(result.value);
                } else {
                    item.reject(result.reason);
                }
            });
        } catch (error) {
            batch.forEach(item => item.reject(error));
        }
    }
    
    // Invalidar cache por patrón
    invalidateCache(pattern) {
        const keysToDelete = [];
        for (const key of this.cache.cache.keys()) {
            if (key.includes(pattern)) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.cache.delete(key));
        console.log(`🗑️ Cache invalidado: ${keysToDelete.length} entradas con patrón '${pattern}'`);
    }
}

// Instancias globales
export const globalCache = new SmartCache();
export const lazyLoader = new LazyLoader();
export const performanceMonitor = new PerformanceMonitor();
export const resourceManager = new ResourceManager();
export const queryOptimizer = new FirebaseQueryOptimizer();

// Configuración inicial de recursos críticos
resourceManager.markCritical('./firebase-config.js');
resourceManager.markCritical('./src/countdown.js');
resourceManager.markCritical('./src/modal.js');

// Exportación por defecto
export default {
    SmartCache,
    debounce,
    throttle,
    LazyLoader,
    PerformanceMonitor,
    ResourceManager,
    FirebaseQueryOptimizer,
    globalCache,
    lazyLoader,
    performanceMonitor,
    resourceManager,
    queryOptimizer
};