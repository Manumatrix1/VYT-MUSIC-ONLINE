# 💰 Sistema VYT-MONEY - Documentación Técnica

## 🎯 Concepto
VYT-MONEY es la moneda digital exclusiva del certamen VYT Music que incentiva la participación masiva através de micro-transacciones accesibles.

## 💡 Modelo de Negocio
- **Precio VYT-MONEY**: $50 ARS = 100 VYT-MONEY (configurable desde admin)
- **Accesibilidad**: Precios bajos para fomentar compras frecuentes
- **Transparencia**: Todo el flujo de dinero es visible públicamente

## 🔢 Estructura de Datos

### **Tabla: VYT-MONEY_config**
```json
{
  "precio_por_100_VYT-MONEY": 50,
  "moneda": "ARS",
  "porcentaje_pozo_inscripciones": 15,
  "porcentaje_pozo_votaciones": 10,
  "activo": true,
  "ultima_actualizacion": "timestamp"
}
```

### **Tabla: usuarios_VYT-MONEY**
```json
{
  "user_id": "string",
  "email": "string", 
  "balance_VYT-MONEY": 250,
  "total_gastado": 1500,
  "total_comprado": 2000,
  "premios_obtenidos": ["estrella_oro", "estandarte_musical"],
  "historial_compras": [],
  "fecha_registro": "timestamp"
}
```

### **Tabla: transacciones_VYT-MONEY**
```json
{
  "transaction_id": "string",
  "user_id": "string",
  "tipo": "compra|voto|premio",
  "cantidad_VYT-MONEY": 50,
  "precio_pagado": 25,
  "payment_id": "mercadopago_id",
  "estado": "completado|pendiente|fallido",
  "participante_votado": "participant_id",
  "fecha": "timestamp"
}
```

### **Tabla: pozo_premios**
```json
{
  "certamen_id": "string",
  "total_pozo": 125000,
  "aporte_inscripciones": 85000,
  "aporte_votaciones": 40000,
  "ultima_actualizacion": "timestamp",
  "historico_aportes": []
}
```

## 🛠️ APIs Necesarias

### **1. MercadoPago Integration**
```javascript
// Compra de VYT-MONEY
exports.comprarVYT-MONEY = onRequest(async (req, res) => {
  const { userId, cantidadVYT-MONEY } = req.body;
  
  // Calcular precio según configuración
  const config = await getVYT-MONEYConfig();
  const precio = (cantidadVYT-MONEY / 100) * config.precio_por_100_VYT-MONEY;
  
  // Crear preferencia MercadoPago
  const preference = new Preference({
    items: [{
      title: `${cantidadVYT-MONEY} VYT-MONEY - VYT Music`,
      quantity: 1,
      unit_price: precio
    }],
    external_reference: `VYT-MONEY_${userId}_${cantidadVYT-MONEY}`,
    notification_url: `${BASE_URL}/webhook-VYT-MONEY`
  });
  
  const response = await preference.save();
  return res.json({ payment_url: response.init_point });
});
```

### **2. Webhook de Confirmación**
```javascript
exports.webhookVYT-MONEY = onRequest(async (req, res) => {
  const { data } = req.body;
  
  // Verificar pago con MercadoPago
  const payment = await getPaymentInfo(data.id);
  
  if (payment.status === 'approved') {
    const [, userId, cantidadVYT-MONEY] = payment.external_reference.split('_');
    
    // Agregar VYT-MONEY al usuario
    await agregarVYT-MONEYUsuario(userId, parseInt(cantidadVYT-MONEY));
    
    // Actualizar pozo de premios
    await actualizarPozoVotaciones(cantidadVYT-MONEY * 0.1); // 10% al pozo
    
    // Registrar transacción
    await registrarTransaccion({
      user_id: userId,
      tipo: 'compra',
      cantidad_VYT-MONEY: cantidadVYT-MONEY,
      precio_pagado: payment.transaction_amount,
      payment_id: payment.id
    });
  }
  
  res.status(200).send('OK');
});
```

## 🎨 Interface de Usuario

### **Componente: Wallet VYT-MONEY**
- Balance actual visible
- Historial de compras
- Botón "Comprar más VYT-MONEY"
- Animaciones de transacciones

### **Proceso de Compra:**
1. Usuario selecciona cantidad (100, 500, 1000 VYT-MONEY)
2. Muestra precio en pesos argentinos
3. Redirección a MercadoPago
4. Confirmación y acreditación automática
5. Animación de "moneditas cayendo"
