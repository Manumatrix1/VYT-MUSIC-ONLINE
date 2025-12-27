# 🧪 TEST MANUAL - TAREA 4 - GUÍA PASO A PASO

**Objetivo**: Validar flujo completo: Admin Aprueba → Pago → Confirmación

---

## 📋 CHECKLIST DE TEST

### PASO 1: LOGIN ADMIN
- [ ] Abrir: https://vytonlineprueva.web.app/admin.html
- [ ] Email: `admin@vyt.com`
- [ ] Password: `vytonline`
- [ ] Click LOGIN

**Esperado**: Deberías ver el dashboard de admin con lista de participantes

---

### PASO 2: BUSCAR PARTICIPANTE EN "PENDIENTE"
- [ ] En admin, buscar la sección "Participantes"
- [ ] Buscar un participante con estado **"pendiente_revision"**
- [ ] Si no hay ninguno:
  - [ ] Crear uno nuevo haciendo click en "Crear Participante"
  - O usar uno existente y cambiar manualmente su estado a "pendiente_revision" en Firestore

**Esperado**: Deberías ver al menos 1 participante con estado "pendiente"

---

### PASO 3: CLICK EN "APROBAR + 💳 PAGAR"
- [ ] Ubicar el botón verde "✅ Aprobar + 💳 Pagar" en la fila del participante
- [ ] Click en el botón
- [ ] Una ventana emergente debe pedir confirmación

**Esperado**: Modal de confirmación

---

### PASO 4: CONFIRMAR APROBACIÓN
- [ ] Click en "SÍ, CONFIRMAR" o similar
- [ ] El sistema debe:
  - ✅ Cambiar estado a **"aprobado_pendiente_pago"**
  - ✅ Generar link de pago
  - ✅ Mostrar link en un alert/modal

**Esperado**: Ves un link tipo:
```
https://vytonlineprueva.web.app/pagar-inscripcion.html?pid=XXXXX&cid=XXXXX
```

---

### PASO 5: VERIFICAR EN FIRESTORE
**Via Firebase Console:**
- [ ] Abrir: https://console.firebase.google.com/project/vytonlineprueva/firestore/data/participantes_certamen
- [ ] Buscar el participante por ID
- [ ] Verificar campo `estado` = **"aprobado_pendiente_pago"**

**Esperado**: Estado cambió correctamente en BD

---

### PASO 6: ABRIR LINK DE PAGO
- [ ] Copiar el link que te mostró el sistema
- [ ] Abrir en navegador
- [ ] Deberías ver página de pago con:
  - ✅ Datos del participante
  - ✅ Monto a pagar
  - ✅ Botón "Pagar con MercadoPago"

**Esperado**: Página de pago carga correctamente

---

### PASO 7: SIMULAR PAGO EN MERCADOPAGO SANDBOX
- [ ] Click en "Pagar con MercadoPago"
- [ ] Te debe redirigir a MercadoPago sandbox
- [ ] Usar tarjeta de prueba:
  ```
  Número: 4111 1111 1111 1111
  Vencimiento: 11/25
  CVC: 123
  Titular: TEST
  ```
- [ ] Click CONFIRMAR PAGO

**Esperado**: Pago se procesa en sandbox

---

### PASO 8: VERIFICAR WEBHOOK
**Lo que debe pasar automáticamente:**
- [ ] MercadoPago notifica al webhook
- [ ] El webhook actualiza el participante:
  - ✅ Estado → **"participando"**
  - ✅ `payment_status` → "approved"
  - ✅ `fecha_pago` → ahora
  - ✅ Pozo del certamen suma $4,500

**Verificar en Firestore Console:**
- [ ] Participante debe tener:
  - `estado`: "participando"
  - `payment_status`: "approved"
  - `fecha_pago`: timestamp actual

---

### PASO 9: VER PÁGINA DE CONFIRMACIÓN
**Después del pago, deberías ver:**
- [ ] URL: `https://vytonlineprueva.web.app/pago/inscripcion-exitosa.html`
- [ ] Mensaje: "✅ Pago confirmado"
- [ ] Detalles del pago
- [ ] Links a ranking y perfil

**Esperado**: Página de éxito con información clara

---

### PASO 10: VERIFICACIÓN FINAL EN ADMIN
- [ ] Volver a admin.html
- [ ] Buscar el mismo participante
- [ ] Verificar que estado ahora es **"participando"**
- [ ] Botón debe haber cambiado (ya no aparece "Aprobar + Pagar")

**Esperado**: Flujo completo funcionando

---

## 🎯 RESULTADO ESPERADO

| Paso | Estado | Verificación |
|------|--------|---|
| 1 | ✅ LOGIN | Usuario autenticado en admin |
| 2 | ✅ BUSCAR | Participante encontrado |
| 3-4 | ✅ APROBAR | Estado → aprobado_pendiente_pago |
| 5 | ✅ BD | Firestore actualizado |
| 6 | ✅ PAGO | Página de pago carga |
| 7 | ✅ MERCADOPAGO | Pago procesado |
| 8 | ✅ WEBHOOK | Estado → participando |
| 9 | ✅ CONFIRMACIÓN | Página de éxito |
| 10 | ✅ FINAL | Admin refleja cambio |

---

## ⚠️ POSIBLES PROBLEMAS

### Problema 1: "Botón no aparece"
**Solución**: Recargar admin.html (Ctrl+Shift+R)

### Problema 2: "Error al llamar Cloud Function"
**Solución**: Verificar que participante esté en estado "aprobado_pendiente_pago"

### Problema 3: "No llega el webhook"
**Solución**: Verificar que MercadoPago webhook esté registrado en Firebase

### Problema 4: "Estado no cambia a participando"
**Solución**: Verificar logs en Firebase Cloud Function

---

## 📞 PUNTO DE REFERENCIA

Si todo funciona:
- ✅ **TAREA 4 LISTA** → Pasar a TAREA 5 (Sistema de Votación)

Si hay problemas:
- 🔧 Debuggear y corregir
- 📝 Documentar el error
- 🔄 Reintentar

---

**¡Vamos!** 🚀
