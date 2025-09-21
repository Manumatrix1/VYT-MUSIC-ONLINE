# 💰 SISTEMA DE PAGOS MÚLTIPLES VYT-MUSIC
## Documentación Completa del Sistema

### 🎯 **RESUMEN DEL SISTEMA IMPLEMENTADO**

Tu plataforma VYT Music ahora cuenta con un **sistema de pagos múltiples completamente automatizado** que maneja:

1. **💸 VYT-MONEY** (Moneda virtual para votar)
2. **🌐 Inscripciones Online** (Por certamen provincial con precios específicos)
3. **🎸 Inscripciones Presenciales** (Evento en Rosario)

---

## 🏗️ **ARQUITECTURA DEL SISTEMA**

### **1. TIPOS DE PAGO SOPORTADOS**

| Tipo | Descripción | Precio | Notificaciones |
|------|-------------|--------|----------------|
| `vyt_money_purchase` | Compra de moneda virtual | Configurable | Usuario + Admin |
| `inscripcion_online` | Inscripción por certamen | Por certamen | Participante + Admin |
| `inscripcion_presencial` | Inscripción evento Rosario | Fijo configurable | Participante + Admin |

### **2. ESTRUCTURA DE EXTERNAL_REFERENCE**

Cada pago tiene un `external_reference` único que identifica el tipo:

```json
// VYT-MONEY
{
  "type": "vyt_money_purchase",
  "user_id": "abc123",
  "cantidad_vyt_money": 500,
  "timestamp": 1647899123000
}

// Inscripción Online
{
  "type": "inscripcion_online",
  "certamen_id": "certamen_xyz",
  "participante_data": { /* datos del participante */ },
  "precio": 15000,
  "timestamp": 1647899123000
}

// Inscripción Presencial
{
  "type": "inscripcion_presencial",
  "participante_data": { /* datos del participante */ },
  "precio": 25000,
  "timestamp": 1647899123000
}
```

---

## 🔧 **FUNCIONES FIREBASE IMPLEMENTADAS**

### **Cloud Functions Nuevas:**

1. **`getPricingConfig`** - Obtener configuración de precios
2. **`createInscripcionOnlinePayment`** - Crear pago inscripción online
3. **`createInscripcionPresencialPayment`** - Crear pago inscripción presencial
4. **`processPaymentNotification`** - Webhook unificado mejorado

### **Funciones Existentes Mejoradas:**

1. **`createVYTMoneyPayment`** - Integrado al sistema unificado
2. **`recibirNotificacionPago`** - Reemplazado por el webhook unificado

---

## 📊 **BASE DE DATOS - ESTRUCTURA**

### **Colecciones Nuevas:**

```
📁 configuracion_precios/
  📄 vyt_money
    - precio_por_100_vyt_money: 50
    - moneda: "ARS"
    - activo: true
    
  📄 inscripcion_online
    - precio_default: 20000
    - descripcion: "Inscripción online nacional"
    - activo: true
    
  📄 inscripcion_presencial
    - precio: 25000
    - descripcion: "Evento presencial Rosario"
    - activo: true

📁 payment_transactions/
  📄 [transaction_id]
    - type: "vyt_money_purchase" | "inscripcion_online" | "inscripcion_presencial"
    - status: "pending" | "approved" | "failed"
    - precio: number
    - created_at: timestamp
    - mercadopago_data: object

📁 certamenes_provinciales/
  📄 [certamen_id]
    - nombre: "Certamen Buenos Aires 2024"
    - provincia: "Buenos Aires"
    - precio: 15000
    - fecha_inicio: timestamp
    - fecha_fin: timestamp
    - activo: true
```

---

## 🔔 **SISTEMA DE NOTIFICACIONES**

### **Por Tipo de Pago:**

#### **VYT-MONEY Purchase:**
- ✅ Email al usuario con balance actualizado
- 📧 Plantilla específica con animaciones de monedas
- 🔗 Link directo para ir a votar

#### **Inscripción Online:**
- ✅ Email al participante con detalles del certamen
- 🔔 Notificación al admin para revisión
- 📄 Datos específicos de provincia y fechas

#### **Inscripción Presencial:**
- ✅ Email al participante con info del evento
- 🎸 Notificación al admin para coordinación
- 📍 Información sobre próximos pasos

---

## 🌐 **URLS DE RETORNO DINÁMICAS**

### **Éxito:**
```
/pago/pago_exitoso.html?tipo=[tipo]&certamen=[nombre]&precio=[precio]
```

### **Error:**
```
/pago/pago_fallido.html?tipo=[tipo]&certamen=[nombre]&precio=[precio]
```

### **Pendiente:**
```
/pago/pago_pendiente.html?tipo=[tipo]&certamen=[nombre]&precio=[precio]
```

---

## 🛠️ **PANEL DE ADMINISTRACIÓN**

### **Acceso:** `/admin-precios.html`

### **Funcionalidades:**

1. **Configurar VYT-MONEY:**
   - Precio por 100 monedas
   - Activar/Desactivar ventas
   - Cambiar moneda

2. **Gestionar Presencial:**
   - Precio del evento
   - Descripción
   - Estado activo/inactivo

3. **Certámenes Provinciales:**
   - Crear nuevos certámenes
   - Editar precios por provincia
   - Configurar fechas
   - Activar/Desactivar

4. **Estadísticas:**
   - Ventas totales por tipo
   - Ingresos en tiempo real
   - Transacciones exitosas

---

## 🚀 **CÓMO USAR EL SISTEMA**

### **Para VYT-MONEY:**
```javascript
const createPayment = httpsCallable(functions, 'createVYTMoneyPayment');
const result = await createPayment({
  cantidad_vyt_money: 500,
  user_id: "user123",
  user_email: "usuario@email.com"
});
// Redirigir a: result.data.init_point
```

### **Para Inscripción Online:**
```javascript
const createPayment = httpsCallable(functions, 'createInscripcionOnlinePayment');
const result = await createPayment({
  participante_data: {
    nombre_artista: "Juan Pérez",
    email: "juan@email.com",
    whatsapp: "1234567890",
    // ... más datos
  },
  certamen_id: "certamen_xyz",
  user_email: "juan@email.com"
});
// Redirigir a: result.data.init_point
```

### **Para Inscripción Presencial:**
```javascript
const createPayment = httpsCallable(functions, 'createInscripcionPresencialPayment');
const result = await createPayment({
  participante_data: {
    nombre_artista: "María García",
    email: "maria@email.com",
    telefono: "1234567890",
    edad: 25
    // ... más datos
  },
  user_email: "maria@email.com"
});
// Redirigir a: result.data.init_point
```

---

## 🔐 **WEBHOOK UNIFICADO**

### **URL del Webhook:**
```
https://us-central1-[PROJECT_ID].cloudfunctions.net/processPaymentNotification
```

### **Cómo Funciona:**
1. MercadoPago envía notificación de pago
2. El webhook identifica el tipo usando `external_reference`
3. Procesa según el tipo:
   - **VYT-MONEY:** Actualiza balance del usuario
   - **Online:** Crea participante en `participantes_online`
   - **Presencial:** Crea participante en `participantes_presencial`
4. Envía emails específicos
5. Notifica al admin según corresponda

---

## 📈 **BENEFICIOS DEL SISTEMA**

### **✅ Ventajas Implementadas:**

1. **Precios Dinámicos:** Cada certamen puede tener su precio específico
2. **Notificaciones Diferenciadas:** Emails únicos por tipo de pago
3. **Webhook Unificado:** Un solo endpoint maneja todos los tipos
4. **Panel Admin Completo:** Gestión total desde la web
5. **Estadísticas en Tiempo Real:** Monitoreo de ingresos
6. **Escalabilidad:** Fácil agregar nuevos tipos de pago
7. **Trazabilidad:** Todos los pagos se registran con detalles completos

---

## 🎯 **PRÓXIMOS PASOS RECOMENDADOS**

1. **Desplegar las nuevas funciones:**
   ```bash
   firebase deploy --only functions
   ```

2. **Configurar precios iniciales:**
   - Acceder a `/admin-precios.html`
   - Configurar VYT-MONEY
   - Crear certámenes provinciales
   - Establecer precio presencial

3. **Probar flujos completos:**
   - Compra de VYT-MONEY
   - Inscripción online con certamen específico
   - Inscripción presencial

4. **Monitorear transacciones:**
   - Verificar que los webhooks lleguen correctamente
   - Revisar que los emails se envíen
   - Confirmar que los datos se guarden bien

---

## 🛡️ **CONSIDERACIONES DE SEGURIDAD**

1. **Validación de Pagos:** Cada pago se verifica con MercadoPago API
2. **External Reference Único:** Previene duplicaciones
3. **Transacciones Atómicas:** Firestore transactions para consistencia
4. **Logs Completos:** Todas las operaciones se registran
5. **Manejo de Errores:** Try-catch en todas las funciones críticas

---

## 📞 **SOPORTE Y MANTENIMIENTO**

Para cualquier problema:

1. **Logs de Firebase Functions:** Console de Firebase
2. **Webhook de MercadoPago:** Verificar notificaciones en panel MP
3. **Base de Datos:** Revisar colecciones en Firestore
4. **Emails:** Verificar configuración de Gmail

---

**¡El sistema está completamente implementado y listo para usar! 🎉**

Ahora puedes manejar múltiples tipos de pagos con precios dinámicos y notificaciones específicas para cada flujo.