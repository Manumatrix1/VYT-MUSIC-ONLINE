# 🎯 PLAN DE IMPLEMENTACIÓN - VYT MUSIC CERTÁMENES

**Fecha inicio**: 21 de Diciembre de 2025  
**Fecha objetivo**: 15 de Enero de 2026  
**Estado**: 3 de 8 tareas completadas ✅

---

## 💰 MODELO ECONÓMICO ACTUALIZADO

### Distribución de Ingresos (70/30)

| Fuente | Precio | Al Pozo (30%) | Ganancia VYT (70%) | Otros |
|--------|--------|---------------|-------------------|-------|
| **Inscripción** | $15,000 | $4,500 | $10,500 | - |
| **Voto** | $1,500 | $450 | $1,050 | - |
| **Entrada** | $5,000 | $1,500 | $1,500 | $2,000 costos |

### Ejemplo Real: Certamen con 100 artistas

```
🎯 POZO INICIAL (Seed Money):        $500,000

📝 INSCRIPCIONES:
   100 artistas × $4,500 (30%)    =  $450,000 al pozo
   100 artistas × $10,500 (70%)   =  $1,050,000 ganancia VYT

❤️ VOTOS:
   800 votos × $450 (30%)         =  $360,000 al pozo
   800 votos × $1,050 (70%)       =  $840,000 ganancia VYT

🎟️ ENTRADAS (si hay evento):
   300 entradas × $1,500 (30%)    =  $450,000 al pozo
   300 entradas × $1,500 (30%)    =  $450,000 ganancia VYT
   300 entradas × $2,000 (40%)    =  $600,000 costos evento

═══════════════════════════════════════════════════════

💎 POZO TOTAL:                       $1,760,000
   🥇 1er lugar (50%):                  $880,000
   🥈 2do lugar (30%):                  $528,000
   🥉 3er lugar (20%):                  $352,000

💰 GANANCIA VYT MUSIC:               $2,340,000
   - Costos evento:                   -$600,000
   - Premios:                       -$1,760,000
   ─────────────────────────────────────────────
   NETO (sin seed):                    -$20,000

📊 MARGEN REAL (sin seed inicial):
   Ingresos: $2,340,000
   Egresos: $2,360,000
   Resultado: -$20,000 (pérdida mínima en 1er certamen)

🚀 ESCALABILIDAD:
   - 2do certamen: menos seed, más participantes = ganancia
   - 3er certamen: sin seed, 200 artistas = $1M+ ganancia
```

---

## ✅ FASE 1: FUNDACIONES (COMPLETADO)

### Tarea 1: Sistema de Zonas Geográficas ✅
**Archivo**: `src/zonas-argentina.js`  
**Completado**: 21/12/2025

**Lo que hace:**
- Base de datos con 5 provincias × 3 regiones = 15 zonas
- 200+ ciudades clasificadas automáticamente
- Función `detectarRegion(ciudad, provincia)` retorna región al instante
- Cupos configurables: Top 35 regional → Top 30 provincial → Top 10 nacional

**Ejemplo:**
```javascript
detectarRegion("Rosario", "Santa Fe")
// → { region: "Sur de Santa Fe", cupoRegional: 35, color: "#FFE66D" }
```

### Tarea 2: Sistema de Fases del Certamen ✅
**Archivo**: `src/certamen-workflow.js`  
**Completado**: 21/12/2025

**Lo que hace:**
- 3 fases: Regional → Provincial → Nacional
- 3 modalidades: Online / Presencial / Híbrido
- Templates completos de Firestore para certámenes y eventos
- Lógica de promoción automática entre fases
- **ACTUALIZADO**: Cálculo correcto del pozo (30% al pozo, 70% ganancia)

### Tarea 3: Integración en Inscripción ✅
**Archivo**: `inscripcion-unificada.html`  
**Completado**: 21/12/2025

**Lo que hace:**
- Detecta región automáticamente al cargar perfil
- Muestra tarjeta verde con ubicación, región y cupos
- Guarda en Firestore: `region`, `codigoRegion`, `cupoRegional`
- Explica al artista en qué región competirá

---

## 🚧 FASE 2: PAGOS Y VOTACIÓN (PRÓXIMA)

### Tarea 4: Pago Obligatorio Post-Aprobación 🔜
**Tiempo estimado**: 2-3 días  
**Prioridad**: 🔥 CRÍTICA (sin esto no funciona el modelo)

**Archivos a crear/modificar:**
- `pagar-inscripcion.html` (nueva página)
- `admin.html` (botón aprobar → trigger notificación)
- `functions/index.js` (Cloud Function para MercadoPago + emails)

**Flujo completo:**
```
1. Admin ve video en admin.html
   ├─ Botón "Aprobar" (verde)
   └─ Botón "Rechazar" (rojo)

2. Si aprueba:
   ├─ Estado cambia: pendiente → aprobado_pendiente_pago
   ├─ Se envía email al artista:
   │   "¡Felicitaciones! Tu video fue aprobado.
   │    Paga $15,000 para comenzar a participar.
   │    Tienes 48 horas."
   └─ Link lleva a: pagar-inscripcion.html?certamen=XXX

3. Artista entra a pagar-inscripcion.html:
   ├─ Ve resumen:
   │   - Certamen: Regional Sur de Santa Fe
   │   - Video: [thumbnail]
   │   - Costo: $15,000
   │   - Distribución: $4,500 al pozo, resto operación
   ├─ Botón "Pagar con MercadoPago"
   └─ Redirige a MercadoPago

4. Después de pago exitoso:
   ├─ Webhook de MercadoPago confirma pago
   ├─ Estado cambia: aprobado_pendiente_pago → participando
   ├─ Video se publica en ranking.html
   ├─ Votos inicializan en 0
   └─ Email: "¡Estás participando! Comparte para conseguir votos"

5. Si NO paga en 48 horas:
   ├─ Cloud Function scheduled (cron job)
   ├─ Estado cambia: aprobado_pendiente_pago → rechazado_timeout
   └─ Email: "Tu aprobación expiró. Vuelve a inscribirte."
```

**Detalles técnicos:**

**A. Página de Pago (pagar-inscripcion.html)**
```html
<!-- Header -->
<h1>Completa tu Inscripción</h1>
<p>Tu video fue aprobado. Paga para comenzar a competir.</p>

<!-- Resumen -->
<div class="resumen-pago">
  <img src="video_thumbnail" />
  <h3>Certamen Regional Sur de Santa Fe</h3>
  <p>Canción: "Mi Canción"</p>
  
  <div class="desglose">
    <div>Inscripción: $15,000</div>
    <div class="small">
      • $4,500 al pozo de premios
      • $10,500 operación del certamen
    </div>
  </div>
  
  <div class="pozo-info">
    💰 Pozo actual: $1,245,000
    🏆 1er lugar: $622,500 (50%)
  </div>
</div>

<!-- Botón MercadoPago -->
<button id="pagar-btn" onclick="iniciarPago()">
  Pagar con MercadoPago ($15,000)
</button>

<div class="timeout-warning">
  ⏰ Tienes 48 horas para pagar o tu aprobación expirará
</div>
```

**B. Cloud Function (functions/index.js)**
```javascript
// Crear preferencia de pago para inscripción
exports.crearPagoInscripcion = functions.https.onCall(async (data, context) => {
  const { participante_id, certamen_id } = data;
  
  // Obtener datos del participante
  const participante = await admin.firestore()
    .collection('participantes_certamen')
    .doc(participante_id)
    .get();
  
  // Verificar que está en estado aprobado_pendiente_pago
  if (participante.data().estado !== 'aprobado_pendiente_pago') {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'El participante no está en estado válido para pago'
    );
  }
  
  // Crear preferencia en MercadoPago
  const preference = {
    items: [{
      title: `Inscripción Certamen VYT Music`,
      quantity: 1,
      unit_price: 15000,
      currency_id: 'ARS'
    }],
    back_urls: {
      success: `https://vyt-online.web.app/pago/inscripcion-exitosa.html?pid=${participante_id}`,
      failure: `https://vyt-online.web.app/pago/inscripcion-fallida.html`,
      pending: `https://vyt-online.web.app/pago/inscripcion-pendiente.html`
    },
    metadata: {
      participante_id,
      certamen_id,
      tipo: 'inscripcion_certamen'
    }
  };
  
  const response = await mercadopago.preferences.create(preference);
  
  return {
    preferenceId: response.body.id,
    initPoint: response.body.init_point
  };
});

// Webhook de MercadoPago
exports.webhookMercadoPago = functions.https.onRequest(async (req, res) => {
  const payment = await mercadopago.payment.get(req.body.data.id);
  
  if (payment.body.status === 'approved') {
    const { participante_id, certamen_id } = payment.body.metadata;
    
    // Actualizar estado del participante
    await admin.firestore()
      .collection('participantes_certamen')
      .doc(participante_id)
      .update({
        estado: 'participando',
        pago_realizado: true,
        pago_aprobado: true,
        pago_fecha: admin.firestore.FieldValue.serverTimestamp(),
        payment_id: payment.body.id,
        pago_monto: payment.body.transaction_amount
      });
    
    // Actualizar pozo del certamen (30% de $15,000 = $4,500)
    await admin.firestore()
      .collection('certamenes')
      .doc(certamen_id)
      .update({
        'pozo.inscripciones': admin.firestore.FieldValue.increment(4500),
        'pozo.total': admin.firestore.FieldValue.increment(4500),
        'ganancias_vyt.inscripciones': admin.firestore.FieldValue.increment(10500),
        'ganancias_vyt.total': admin.firestore.FieldValue.increment(10500),
        'stats.participantes_pagaron': admin.firestore.FieldValue.increment(1)
      });
    
    // Enviar email de confirmación
    await sendEmail({
      to: participante.email,
      subject: '¡Estás participando en VYT Music! 🎤',
      html: `
        <h1>¡Felicitaciones!</h1>
        <p>Tu pago fue aprobado. Ya estás participando en el certamen.</p>
        <p>Comparte tu video en redes sociales para conseguir votos:</p>
        <a href="https://vyt-online.web.app/ranking.html?artista=${participante_id}">
          Ver mi posición en el ranking
        </a>
      `
    });
  }
  
  res.status(200).send('OK');
});

// Cron job: expirar aprobaciones sin pago después de 48hs
exports.expirarAprobacionesPendientes = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const hace48Horas = Date.now() - (48 * 60 * 60 * 1000);
    
    const pendientes = await admin.firestore()
      .collection('participantes_certamen')
      .where('estado', '==', 'aprobado_pendiente_pago')
      .where('aprobado_el', '<', new Date(hace48Horas))
      .get();
    
    for (const doc of pendientes.docs) {
      await doc.ref.update({
        estado: 'rechazado_timeout',
        razon_rechazo: 'No completó el pago en 48 horas'
      });
      
      // Enviar email notificando expiración
      await sendEmail({
        to: doc.data().userEmail,
        subject: 'Tu aprobación expiró - VYT Music',
        html: `
          <p>Tu video fue aprobado pero no completaste el pago en 48 horas.</p>
          <p>Puedes volver a inscribirte cuando estés listo.</p>
        `
      });
    }
  });
```

**C. Admin Panel (admin.html)**
```javascript
// En la sección de participantes pendientes
async function aprobarParticipante(participante_id) {
  await firebase.firestore()
    .collection('participantes_certamen')
    .doc(participante_id)
    .update({
      estado: 'aprobado_pendiente_pago',
      aprobado_el: firebase.firestore.FieldValue.serverTimestamp(),
      aprobado_por: currentUser.uid
    });
  
  // Enviar email al artista
  await firebase.functions().httpsCallable('enviarEmailAprobacion')({
    participante_id: participante_id
  });
  
  showNotification('Video aprobado. El artista fue notificado para realizar el pago.', 'success');
  loadParticipantes(); // Recargar lista
}
```

---

### Tarea 5: Votación con VYT Money 🔜
**Tiempo estimado**: 2 días  
**Prioridad**: 🔥 CRÍTICA

**Archivos a modificar:**
- `ranking.html` (botón votar funcional)
- `functions/index.js` (Cloud Function registrar voto)

**Flujo:**
```
1. Fan ve ranking.html
   └─ Click en "Votar" (cuesta 1000 VYT Money)

2. Sistema verifica:
   ├─ ¿Usuario logueado? → Si no, redirige a login
   ├─ ¿Tiene 1000 VYT Money? → Si no, modal "Comprar VYT Money"
   └─ Si tiene → proceder

3. Registrar voto:
   ├─ Decrementar 1000 VYT Money del usuario
   ├─ Incrementar contador de votos del artista
   ├─ Registrar en colección "votos" (para evitar doble voto)
   ├─ Actualizar pozo: +$450 (30%)
   ├─ Actualizar ganancias VYT: +$1,050 (70%)
   └─ Recalcular ranking

4. Feedback visual:
   ├─ Animación de corazón
   ├─ Contador sube +1
   ├─ Posición puede cambiar
   └─ Mostrar: "¡Votaste por [Artista]! 💙"
```

---

### Tarea 6: Eventos Presenciales 🔜
**Tiempo estimado**: 3-4 días  
**Prioridad**: 🟡 MEDIA (se puede hacer después)

**Archivos a crear:**
- `crear-evento.html` (admin)
- `evento.html` (página pública del evento)
- `comprar-entrada.html` (compra de entradas)
- `validar-entrada.html` (staff en puerta)

---

### Tarea 7: Top N Automático 🔜
**Tiempo estimado**: 1-2 días  
**Prioridad**: 🟡 MEDIA

**Funcionalidad:**
- Botón en admin: "Cerrar votación y extraer Top 35"
- Query Firestore ordenado por votos DESC limit 35
- Crear certamen provincial con los clasificados
- Notificar a artistas que clasificaron

---

### Tarea 8: Pozo en Tiempo Real 🔜
**Tiempo estimado**: 1 día  
**Prioridad**: 🟢 BAJA (cosmético)

**Funcionalidad:**
- Widget que se actualiza cada 5 segundos
- Muestra: Pozo total, 1er lugar, 2do, 3ro
- Desglose: inscripciones + votos + entradas

---

## 📅 TIMELINE ACTUALIZADO

| Fecha | Tarea | Horas | Estado |
|-------|-------|-------|--------|
| **21 Dic** | ✅ Zonas geográficas | 3h | HECHO |
| **21 Dic** | ✅ Sistema de fases | 2h | HECHO |
| **21 Dic** | ✅ Integración inscripción | 2h | HECHO |
| **24-26 Dic** | 🎄 Fiestas | - | - |
| **27-29 Dic** | 🔜 Pago obligatorio | 16h | PENDIENTE |
| **30 Dic - 1 Ene** | 🔜 Votación VYT Money | 12h | PENDIENTE |
| **2-5 Ene** | 🔜 Eventos presenciales | 24h | PENDIENTE |
| **6-7 Ene** | 🔜 Top N automático | 8h | PENDIENTE |
| **8 Ene** | 🔜 Pozo tiempo real | 4h | PENDIENTE |
| **9-12 Ene** | Testing | 20h | PENDIENTE |
| **15 Ene** | 🚀 LANZAMIENTO | - | - |

**Total horas desarrollo**: ~91 horas  
**Días laborables**: 16 días (sin fiestas)  
**Promedio**: 5.7 horas/día

---

## 🎯 PRÓXIMO PASO INMEDIATO

**COMENZAR CON TAREA #4: Pago Obligatorio Post-Aprobación**

**¿Por qué esta primero?**
1. Sin pagos, no hay modelo de negocio
2. Es la base para que funcione el pozo
3. Los artistas necesitan pagar para participar
4. Es crítico para el flujo completo

**Archivos a crear:**
1. `pagar-inscripcion.html`
2. `pago/inscripcion-exitosa.html`
3. `pago/inscripcion-fallida.html`
4. `pago/inscripcion-pendiente.html`

**Funciones a agregar:**
1. `crearPagoInscripcion` en `functions/index.js`
2. `webhookMercadoPago` en `functions/index.js`
3. `expirarAprobacionesPendientes` (cron job)
4. `enviarEmailAprobacion` en `functions/index.js`

**Modificaciones:**
1. `admin.html` → botones aprobar/rechazar funcionales
2. `inscripcion-unificada.html` → estado pendiente después de inscribirse

---

## ✅ CHECKLIST ANTES DE EMPEZAR

- [x] Sistema de zonas funcionando
- [x] Templates de Firestore definidos
- [x] Modelo económico claro (30% pozo, 70% ganancia)
- [x] MercadoPago ya integrado en comprar-vyt-money.html
- [ ] Configurar MercadoPago para inscripciones
- [ ] Crear páginas de pago
- [ ] Configurar webhooks en MercadoPago
- [ ] Desplegar Cloud Functions

---

**¿Listo para comenzar con los pagos? 🚀**
