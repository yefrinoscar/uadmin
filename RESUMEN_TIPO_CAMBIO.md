# Sistema de Tipo de Cambio - Resumen

## ✅ Implementación Completada

He implementado un sistema completo de tipo de cambio que obtiene datos de la API de Decolecta y los almacena en la base de datos.

## 🎯 Lo que se ha creado

### 1. Base de Datos
- **Archivo**: `supabase/migrations/20250604_create_exchange_rates_table.sql`
- Tabla `exchange_rates` para almacenar tipos de cambio diarios
- Campos: buy_price, sell_price, date, base_currency, quote_currency

### 2. Cron Job API (Ejecuta diariamente a las 9 AM)
- **Archivo**: `app/api/exchange-rate/cron/route.ts`
- Obtiene el tipo de cambio de Decolecta API
- Lo guarda en la base de datos
- Previene duplicados
- Solo consume 1 petición al día (30 peticiones al mes de las 100 disponibles)

### 3. API de Consulta
- **Archivo**: `app/api/exchange-rate/current/route.ts`
- Devuelve el tipo de cambio más reciente de la BD
- No consume peticiones de Decolecta

### 4. tRPC Router
- **Archivo**: `trpc/api/routers/exchangeRate.ts`
- `getCurrent()`: Obtiene el tipo de cambio actual
- `getByDate()`: Obtiene tipo de cambio por fecha
- `getHistory()`: Obtiene histórico
- `triggerFetch()`: Ejecuta manualmente el cron job

### 5. UI Actualizada
- **Archivo**: `app/(dashboard)/dashboard/requests/[id]/components/TotalSummaryCard.tsx`
- Campo de tipo de cambio editable (haz clic para editar)
- Botón de refresh para actualizar desde BD
- Se guarda automáticamente con el botón "Guardar Cambios"

### 6. Store Actualizado
- **Archivo**: `store/requestDetailStore.ts`
- `setExchangeRate()` ahora actualiza también el request

### 7. Configuración Vercel Cron
- **Archivo**: `vercel.json`
- Configurado para ejecutar a las 9 AM UTC diariamente

## 📋 Pasos para Activar

### 1. Agregar Variables de Entorno

En tu archivo `.env.local` y en Vercel:

```env
DECOLECTA_API_KEY=tu_api_key_de_decolecta
CRON_SECRET=un_secreto_aleatorio_seguro

# Ya deberías tener estas (requeridas para Supabase):
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

**Nota**: Las APIs ahora usan `createAuthenticatedClient()` que reutiliza la configuración de Supabase existente.

### 2. Ejecutar Migración de Base de Datos

```bash
# Opción 1: Si usas Supabase CLI
supabase db push

# Opción 2: Ejecutar manualmente en Supabase Dashboard
# Ve a SQL Editor y ejecuta el contenido de:
# supabase/migrations/20250604_create_exchange_rates_table.sql
```

### 3. Desplegar a Vercel

```bash
git add .
git commit -m "Add exchange rate system"
git push
```

El cron job se activará automáticamente en producción.

### 4. Ejecutar Manualmente la Primera Vez

Para obtener el tipo de cambio inmediatamente:

```bash
curl -X POST https://tu-dominio.com/api/exchange-rate/cron \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

O desde el código:
```typescript
await trpc.exchangeRate.triggerFetch.mutate();
```

## 🎨 Cómo Usar en la UI

1. Ve a cualquier pedido (requests/[id])
2. En el panel de "Totals Summary" verás el tipo de cambio (TC: S/. X.XXXX)
3. **Para editar**: Haz clic en el tipo de cambio
4. **Para actualizar desde BD**: Haz clic en el botón 🔄
5. **Para guardar**: Haz clic en "Guardar Cambios"

## 🔧 Alternativas al Cron de Vercel

Si no tienes plan Pro de Vercel, usa:

### GitHub Actions
Crea `.github/workflows/exchange-rate-cron.yml`:
```yaml
name: Update Exchange Rate
on:
  schedule:
    - cron: '0 9 * * *'
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Update
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/exchange-rate/cron \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### cron-job.org
1. Crea cuenta en https://cron-job.org
2. URL: `https://tu-dominio.com/api/exchange-rate/cron`
3. Schedule: Diario a las 9 AM
4. Header: `Authorization: Bearer TU_CRON_SECRET`

## 📊 Ventajas del Sistema

✅ **Solo 30 peticiones al mes** (de las 100 disponibles)
✅ **Tipo de cambio siempre disponible** desde la BD
✅ **Editable manualmente** si es necesario
✅ **Histórico completo** en la base de datos
✅ **Sin límites de consulta** (lee de BD, no de API)
✅ **Actualización automática** diaria

## 🐛 Troubleshooting

### "No exchange rate data available"
```bash
# Ejecuta manualmente el cron:
curl -X POST http://localhost:3000/api/exchange-rate/cron
```

### El cron no se ejecuta
- Verifica que estés en producción (no funciona en desarrollo)
- Verifica las variables de entorno en Vercel
- Revisa los logs en Vercel Dashboard

### El tipo de cambio no se guarda
- Verifica que hayas ejecutado la migración de BD
- Revisa la consola del navegador para errores

## 📚 Documentación Completa

Ver `EXCHANGE_RATE_SETUP.md` para documentación detallada.

## ✨ Próximos Pasos Opcionales

- [ ] Agregar gráfico de histórico de tipo de cambio
- [ ] Notificaciones cuando cambie significativamente
- [ ] Dashboard de estadísticas de tipo de cambio
- [ ] Alertas si el cron job falla
