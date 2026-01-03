/**
 * LOAD TESTING SCRIPT - VYT MUSIC
 * Prueba de saturación del sistema
 * 
 * Este script simula múltiples usuarios concurrentes para testear
 * la capacidad de respuesta del sistema
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuración
const CONFIG = {
  BASE_URL: 'https://vytonlineprueva.web.app',
  FUNCTIONS_URL: 'https://us-central1-vytonlineprueva.cloudfunctions.net',
  
  // Parámetros de carga
  CONCURRENT_USERS: 50,      // Usuarios simultáneos
  REQUESTS_PER_USER: 10,      // Requests por usuario
  RAMP_UP_TIME: 5000,         // Tiempo de rampa (ms)
  
  // Endpoints a testear
  ENDPOINTS: [
    { path: '/', method: 'GET', name: 'Home' },
    { path: '/principal.html', method: 'GET', name: 'Principal' },
    { path: '/certamenes.html', method: 'GET', name: 'Certámenes' },
    { path: '/ranking.html', method: 'GET', name: 'Ranking' },
    { path: '/healthCheck', method: 'GET', name: 'Health Check (Function)' }
  ]
};

// Estadísticas
const stats = {
  total_requests: 0,
  successful_requests: 0,
  failed_requests: 0,
  total_time: 0,
  min_time: Infinity,
  max_time: 0,
  response_times: [],
  errors: []
};

/**
 * Hacer un request HTTP
 */
async function makeRequest(endpoint, userId) {
  const url = endpoint.name.includes('Function') 
    ? `${CONFIG.FUNCTIONS_URL}${endpoint.path}`
    : `${CONFIG.BASE_URL}${endpoint.path}`;
    
  const startTime = performance.now();
  
  try {
    const response = await axios({
      method: endpoint.method,
      url: url,
      timeout: 30000, // 30 segundos timeout
      headers: {
        'User-Agent': `LoadTest-User-${userId}`
      }
    });
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    stats.successful_requests++;
    stats.response_times.push(responseTime);
    stats.total_time += responseTime;
    stats.min_time = Math.min(stats.min_time, responseTime);
    stats.max_time = Math.max(stats.max_time, responseTime);
    
    return {
      success: true,
      statusCode: response.status,
      responseTime,
      endpoint: endpoint.name
    };
    
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    stats.failed_requests++;
    stats.errors.push({
      endpoint: endpoint.name,
      error: error.message,
      code: error.code
    });
    
    return {
      success: false,
      error: error.message,
      responseTime,
      endpoint: endpoint.name
    };
  } finally {
    stats.total_requests++;
  }
}

/**
 * Simular un usuario haciendo múltiples requests
 */
async function simulateUser(userId, delay) {
  // Esperar tiempo de rampa
  await new Promise(resolve => setTimeout(resolve, delay));
  
  console.log(`👤 Usuario ${userId} iniciado`);
  
  const results = [];
  
  for (let i = 0; i < CONFIG.REQUESTS_PER_USER; i++) {
    const endpoint = CONFIG.ENDPOINTS[i % CONFIG.ENDPOINTS.length];
    const result = await makeRequest(endpoint, userId);
    results.push(result);
    
    // Pequeña pausa entre requests del mismo usuario
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

/**
 * Calcular estadísticas
 */
function calculateStats() {
  const avgTime = stats.total_time / stats.successful_requests;
  
  // Ordenar tiempos de respuesta
  stats.response_times.sort((a, b) => a - b);
  
  // Percentiles
  const p50Index = Math.floor(stats.response_times.length * 0.5);
  const p90Index = Math.floor(stats.response_times.length * 0.9);
  const p95Index = Math.floor(stats.response_times.length * 0.95);
  const p99Index = Math.floor(stats.response_times.length * 0.99);
  
  return {
    total_requests: stats.total_requests,
    successful: stats.successful_requests,
    failed: stats.failed_requests,
    success_rate: ((stats.successful_requests / stats.total_requests) * 100).toFixed(2) + '%',
    avg_response_time: avgTime.toFixed(2) + 'ms',
    min_response_time: stats.min_time.toFixed(2) + 'ms',
    max_response_time: stats.max_time.toFixed(2) + 'ms',
    p50_percentile: stats.response_times[p50Index]?.toFixed(2) + 'ms',
    p90_percentile: stats.response_times[p90Index]?.toFixed(2) + 'ms',
    p95_percentile: stats.response_times[p95Index]?.toFixed(2) + 'ms',
    p99_percentile: stats.response_times[p99Index]?.toFixed(2) + 'ms',
    requests_per_second: (stats.total_requests / (stats.total_time / 1000)).toFixed(2),
    errors: stats.errors.slice(0, 10) // Primeros 10 errores
  };
}

/**
 * Ejecutar test de carga
 */
async function runLoadTest() {
  console.log('🚀 INICIANDO LOAD TEST - VYT MUSIC');
  console.log('=====================================');
  console.log(`Usuarios concurrentes: ${CONFIG.CONCURRENT_USERS}`);
  console.log(`Requests por usuario: ${CONFIG.REQUESTS_PER_USER}`);
  console.log(`Total requests: ${CONFIG.CONCURRENT_USERS * CONFIG.REQUESTS_PER_USER}`);
  console.log(`Tiempo de rampa: ${CONFIG.RAMP_UP_TIME}ms`);
  console.log('=====================================\n');
  
  const startTime = performance.now();
  
  // Crear promesas para todos los usuarios
  const userPromises = [];
  const delayBetweenUsers = CONFIG.RAMP_UP_TIME / CONFIG.CONCURRENT_USERS;
  
  for (let i = 0; i < CONFIG.CONCURRENT_USERS; i++) {
    const delay = i * delayBetweenUsers;
    userPromises.push(simulateUser(i + 1, delay));
  }
  
  // Esperar a que terminen todos
  console.log('⏳ Ejecutando requests...\n');
  await Promise.all(userPromises);
  
  const endTime = performance.now();
  const totalDuration = (endTime - startTime) / 1000;
  
  // Calcular y mostrar estadísticas
  console.log('\n=====================================');
  console.log('📊 RESULTADOS DEL LOAD TEST');
  console.log('=====================================');
  
  const finalStats = calculateStats();
  
  console.log(`\n⏱️  Duración total: ${totalDuration.toFixed(2)}s`);
  console.log(`📨 Total requests: ${finalStats.total_requests}`);
  console.log(`✅ Exitosos: ${finalStats.successful}`);
  console.log(`❌ Fallidos: ${finalStats.failed}`);
  console.log(`📈 Tasa de éxito: ${finalStats.success_rate}`);
  
  console.log(`\n⚡ TIEMPOS DE RESPUESTA:`);
  console.log(`   Promedio: ${finalStats.avg_response_time}`);
  console.log(`   Mínimo: ${finalStats.min_response_time}`);
  console.log(`   Máximo: ${finalStats.max_response_time}`);
  console.log(`   P50 (mediana): ${finalStats.p50_percentile}`);
  console.log(`   P90: ${finalStats.p90_percentile}`);
  console.log(`   P95: ${finalStats.p95_percentile}`);
  console.log(`   P99: ${finalStats.p99_percentile}`);
  
  console.log(`\n🔥 THROUGHPUT:`);
  console.log(`   Requests/segundo: ${finalStats.requests_per_second}`);
  
  if (finalStats.errors.length > 0) {
    console.log(`\n❌ ERRORES (primeros 10):`);
    finalStats.errors.forEach((err, i) => {
      console.log(`   ${i + 1}. [${err.endpoint}] ${err.error}`);
    });
  }
  
  console.log('\n=====================================');
  
  // Evaluación del sistema
  console.log('\n🎯 EVALUACIÓN:');
  
  const successRate = parseFloat(finalStats.success_rate);
  const avgTime = parseFloat(finalStats.avg_response_time);
  
  if (successRate >= 99 && avgTime < 500) {
    console.log('   🟢 EXCELENTE - Sistema altamente escalable');
  } else if (successRate >= 95 && avgTime < 1000) {
    console.log('   🟡 BUENO - Sistema estable con carga moderada');
  } else if (successRate >= 90 && avgTime < 2000) {
    console.log('   🟠 ACEPTABLE - Considerar optimizaciones');
  } else {
    console.log('   🔴 CRÍTICO - Sistema necesita optimización urgente');
  }
  
  console.log('\n✅ Test completado\n');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runLoadTest().catch(console.error);
}

module.exports = { runLoadTest, CONFIG };
