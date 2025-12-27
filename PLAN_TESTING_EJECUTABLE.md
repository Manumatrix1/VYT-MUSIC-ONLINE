# 🧪 PLAN DE TESTING - TAREA 4

**Fecha**: 27 de diciembre de 2025  
**Objetivo**: Validar flujo completo: Aprobación → Pago → Confirmación

---

## 📋 TESTS A EJECUTAR

### **TEST 1: Verificar HTML de Pagos** ✅
**Tiempo**: 5 min

```
□ Abrir: /pagar-inscripcion.html
□ Ver: Form de pago
□ Cargar datos del participante
□ Mostrar: Certamen, Canción, Artista
□ Mostrar: Pozo actual
□ Verificar: Botón "Pagar con MercadoPago" visible
□ Verificar: No hay errores en consola
```

---

### **TEST 2: Verificar Admin Panel** ✅
**Tiempo**: 5 min

```
□ Abrir: admin.html
□ Login: admin@vyt.com / vytonline
□ Ir a: Participantes
□ Buscar: Participante con estado "pendiente"
□ Verificar: Botón "Aprobar + Pagar" visible
□ Click botón → debe mostrar confirmación
□ Cambiar estado a: aprobado_pendiente_pago
□ Mostrar: Link de pago en alert
```

---

### **TEST 3: Verificar Cloud Function** ⚠️
**Tiempo**: 10 min

```
□ Verificar: functions/index.js tiene crearPagoInscripcion()
□ Verificar: Sintaxis correcta
□ Verificar: Importa MercadoPago
□ Si está desplegada:
  - Llamar función desde browser
  - Verificar: Retorna initPoint
  - Verificar: Guarda en payment_transactions
```

---

### **TEST 4: Verificar Webhook** ⚠️
**Tiempo**: 10 min

```
□ Verificar: payments.js actualiza estado correctamente
□ Verificar: Cambia a "participando"
□ Verificar: Suma pozo del certamen
□ Si MercadoPago conectado:
  - Simular webhook
  - Verificar Firestore actualiza
```

---

### **TEST 5: Test End-to-End SIMULADO** 
**Tiempo**: 15 min

```
SIN MercadoPago (sandbox offline):
□ Test Paso 1: Admin aprueba participante
  → Verificar: Estado = aprobado_pendiente_pago ✅
  
□ Test Paso 2: Participante va a pagar
  → Abrir: pagar-inscripcion.html?pid=xxx
  → Verificar: Carga datos correctamente ✅
  
□ Test Paso 3: Click "Pagar"
  → Verificar: Cloud Function se intenta llamar
  → Sin token MercadoPago: error esperado ⚠️
  
□ Test Paso 4: Verificar structure
  → Link URL bien formada
  → Estados correctos en BD
  → Flujo lógico completo
```

---

## 🔴 PROBLEMAS CONOCIDOS

**BLOQUEADOR 1: Token MercadoPago**
- [ ] Necesita estar en `functions/.env` o Firebase config
- [ ] Sin token → Cloud Function falla
- **Solución**: Configurar token o usar sandbox

**BLOQUEADOR 2: Webhook no registrado**
- [ ] MercadoPago necesita saber dónde enviar notificaciones
- [ ] Sin webhook → No actualiza estado post-pago
- **Solución**: Registrar en dashboard MP

**BLOQUEADOR 3: Firebase Functions no desplegada**
- [ ] Si no está desplegada → funciones no accesibles
- **Solución**: `firebase deploy --only functions`

---

## ✅ TESTS QUE PODEMOS HACER AHORA

1. ✅ **Verificar HTML** - HTML cargas bien
2. ✅ **Verificar Admin UI** - Botón aparece
3. ✅ **Verificar Flow Lógico** - Estados cambian
4. ✅ **Verificar Syntax** - Sin errores
5. ⚠️ **Test MercadoPago** - Requiere token

---

## 🎯 ESTRATEGIA

**Opción A: Test sin MercadoPago**
- Mock la Cloud Function
- Simular respuesta exitosa
- Verificar flujo sin depender de MP
- ⏱️ 30 min
- ✅ Identifica problemas lógicos

**Opción B: Test con MercadoPago Sandbox**
- Configurar token sandbox de MP
- Deploy Cloud Functions
- Test completo end-to-end
- ⏱️ 1-2 horas
- ✅ Verifica todo

---

## 💭 RECOMENDACIÓN

**Hacer Opción A primero** (30 min):
- Valida todo el flujo sin dependencias externas
- Identifica bugs rápido
- Más seguro

**Luego Opción B** (1 hora):
- Cuando MercadoPago token esté listo
- Para antes de producción

---

**¿Empezamos con TEST 1?** 🚀
