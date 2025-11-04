# Exchange Rate System Setup

Este documento explica el sistema de tipo de cambio implementado que obtiene datos de la API de Decolecta.

## Descripción General

El sistema consta de:
1. **Base de datos**: Tabla `exchange_rates` para almacenar tipos de cambio diarios
2. **Cron Job**: API que se ejecuta diariamente a las 9 AM para obtener el tipo de cambio
3. **API de consulta**: Endpoint para obtener el tipo de cambio actual
4. **tRPC Router**: Funciones para gestionar tipos de cambio
5. **UI**: Campo editable en el componente TotalSummaryCard

## Configuración Requerida

### 1. Variables de Entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```env
# Decolecta API
DECOLECTA_API_KEY=tu_api_key_aqui

# Cron Job Security (opcional pero recomendado)
CRON_SECRET=un_secreto_aleatorio_seguro

# Supabase (ya deberías tenerlas)
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# App URL (para producción)
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

**Nota**: Las APIs ahora usan `createAuthenticatedClient()` de `@/lib/supabase-client` que reutiliza la configuración existente de Supabase.

### 2. Migración de Base de Datos

Ejecuta la migración para crear la tabla `exchange_rates`:

```bash
# Si usas Supabase CLI
supabase db push

# O ejecuta manualmente el archivo SQL:
# supabase/migrations/20250604_create_exchange_rates_table.sql
```

### 3. Configuración del Cron Job en Vercel

El archivo `vercel.json` ya está configurado para ejecutar el cron job diariamente a las 9 AM (hora UTC).

**Importante**: 
- El cron job solo funciona en producción (no en desarrollo local)
- Asegúrate de que la variable `CRON_SECRET` esté configurada en Vercel
- Vercel Cron Jobs requiere un plan Pro o superior

Para configurar en Vercel:
1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega todas las variables de entorno necesarias
4. Despliega tu aplicación

### 4. Configuración Alternativa (Sin Vercel Cron)

Si no tienes acceso a Vercel Cron Jobs, puedes usar servicios externos:

#### Opción A: cron-job.org
1. Crea una cuenta en https://cron-job.org
2. Crea un nuevo cron job con:
   - URL: `https://tu-dominio.com/api/exchange-rate/cron`
   - Schedule: `0 9 * * *` (9 AM diario)
   - Headers: `Authorization: Bearer TU_CRON_SECRET`

#### Opción B: GitHub Actions
Crea `.github/workflows/exchange-rate-cron.yml`:

```yaml
name: Update Exchange Rate
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  update-exchange-rate:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Exchange Rate Update
        run: |
          curl -X POST https://tu-dominio.com/api/exchange-rate/cron \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Uso

### Obtener el Tipo de Cambio Actual

#### Desde el Frontend (tRPC)
```typescript
import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';

const trpc = useTRPC();
const { data: exchangeRate } = useSuspenseQuery(
  trpc.exchangeRate.getCurrent.queryOptions()
);

console.log(exchangeRate?.sell_price); // Precio de venta
console.log(exchangeRate?.buy_price);  // Precio de compra
```

#### Desde una API Route
```typescript
const response = await fetch('/api/exchange-rate/current');
const { data } = await response.json();
console.log(data.sell_price);
```

### Actualizar Manualmente el Tipo de Cambio

#### Desde el Frontend
```typescript
const triggerFetch = trpc.exchangeRate.triggerFetch.useMutation();

await triggerFetch.mutateAsync();
```

#### Usando cURL
```bash
curl -X POST https://tu-dominio.com/api/exchange-rate/cron \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

### Editar el Tipo de Cambio en la UI

En el componente `TotalSummaryCard`:
1. Haz clic en el tipo de cambio mostrado (TC: S/. X.XXXX)
2. Edita el valor
3. Presiona Enter o haz clic fuera del campo
4. El tipo de cambio se actualizará en el store
5. Haz clic en "Guardar Cambios" para persistir en la base de datos

El botón de refresh (🔄) actualiza el tipo de cambio desde la base de datos.

## Estructura de Archivos

```
├── app/
│   └── api/
│       └── exchange-rate/
│           ├── cron/
│           │   └── route.ts          # Cron job endpoint
│           └── current/
│               └── route.ts          # Get current rate endpoint
├── trpc/
│   └── api/
│       └── routers/
│           └── exchangeRate.ts       # tRPC router
├── supabase/
│   └── migrations/
│       └── 20250604_create_exchange_rates_table.sql
├── store/
│   └── requestDetailStore.ts        # Zustand store (actualizado)
└── app/(dashboard)/dashboard/requests/[id]/components/
    └── TotalSummaryCard.tsx         # UI component (actualizado)
```

## API de Decolecta

### Endpoint
```
GET https://api.decolecta.com/v1/tipo-cambio/sunat?date=YYYY-MM-DD
```

### Headers
```
Content-Type: application/json
Authorization: Bearer <API_KEY>
```

### Respuesta
```json
{
  "buy_price": "3.540",
  "sell_price": "3.552",
  "base_currency": "USD",
  "quote_currency": "PEN",
  "date": "2025-07-26"
}
```

### Límites
- **100 peticiones por mes**
- Por eso usamos un cron job diario para no exceder el límite

## Troubleshooting

### El cron job no se ejecuta
1. Verifica que estés en producción (no funciona en desarrollo)
2. Verifica las variables de entorno en Vercel
3. Revisa los logs en Vercel Dashboard → Deployments → Functions

### Error "No exchange rate data available"
1. Ejecuta manualmente el cron job: `POST /api/exchange-rate/cron`
2. Verifica que la API key de Decolecta sea válida
3. Revisa los logs del servidor

### El tipo de cambio no se guarda
1. Verifica que el campo `exchange_rate` exista en la tabla `purchase_requests`
2. Verifica que el mutation `updateRequest` incluya `exchangeRate`
3. Revisa la consola del navegador para errores

## Testing

### Test Manual del Cron Job
```bash
# Desarrollo local
curl -X POST http://localhost:3000/api/exchange-rate/cron

# Producción
curl -X POST https://tu-dominio.com/api/exchange-rate/cron \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

### Verificar Datos en la Base de Datos
```sql
SELECT * FROM exchange_rates ORDER BY date DESC LIMIT 10;
```

## Notas Importantes

1. **Zona Horaria**: El cron job usa hora UTC. 9 AM UTC = 4 AM Lima (Perú)
2. **Duplicados**: El sistema previene duplicados verificando si ya existe un registro para la fecha actual
3. **Edición Manual**: Los usuarios pueden editar el tipo de cambio manualmente si es necesario
4. **Persistencia**: Los cambios se guardan en la base de datos al hacer clic en "Guardar Cambios"

## Próximos Pasos

- [ ] Configurar alertas si el cron job falla
- [ ] Agregar histórico de tipos de cambio en la UI
- [ ] Implementar gráfico de tendencia del tipo de cambio
- [ ] Agregar notificaciones cuando el tipo de cambio cambie significativamente
