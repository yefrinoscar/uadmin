# Sistema de Pedidos - Guía Rápida de Referencia

## 🚀 Inicio Rápido

### Archivos Principales
```
📁 app/(dashboard)/dashboard/requests/
  ├── 📄 page.tsx                    # Página principal de listado
  ├── 📄 types.ts                    # Tipos y constantes
  ├── 📁 [id]/
  │   ├── 📄 page.tsx                # Página de detalle
  │   └── 📁 components/             # Componentes de detalle
  ├── 📁 _components/
  │   ├── 📄 requests-table.tsx      # Tabla con paginación
  │   ├── 📄 requests-kpis.tsx       # Métricas y estadísticas
  │   ├── 📄 RequestsFilters.tsx     # Filtros de búsqueda
  │   └── 📄 AddRequestDialog.tsx    # Crear nuevo pedido
  └── 📁 hooks/
      ├── 📄 useRequestFilters.ts    # Gestión de filtros
      └── 📄 use-requests.ts         # Queries de datos

📁 trpc/api/routers/
  └── 📄 requests.ts                 # API Router (1126 líneas)
```

---

## 📋 Estados del Pedido

| Estado | Español | Color | Siguiente Estado |
|--------|---------|-------|------------------|
| `pending` | Pendiente | 🟡 Amarillo | in_progress, cancelled |
| `in_progress` | En Proceso | 🔵 Azul | in_transit, cancelled |
| `in_transit` | En Camino | 🟣 Violeta | delivered, completed, cancelled |
| `completed` | Completado | 🟢 Verde | (Final) |
| `delivered` | Entregado | 🟢 Verde azulado | (Final) |
| `cancelled` | Cancelado | 🔴 Rojo | (Final) |

---

## 🔌 API Endpoints Principales

### Consultas (Queries)

#### `requests.getAll`
```typescript
// Obtener lista paginada con filtros
const { data } = useQuery(
  trpc.requests.getAll.queryOptions({
    page: 1,
    pageSize: 10,
    filters: {
      status: "pending",
      clientId: "uuid",
      text: "búsqueda"
    }
  })
)
// Retorna: { items: PurchaseRequestList[], totalCount: number }
```

#### `requests.getById`
```typescript
// Obtener detalle completo de un pedido
const { data } = useQuery(
  trpc.requests.getById.queryOptions({ id: "uuid" })
)
// Retorna: PurchaseRequest | null
```

#### `requests.getStats`
```typescript
// Obtener estadísticas y KPIs
const { data } = useQuery(
  trpc.requests.getStats.queryOptions({ 
    period: "current_month" // "last_month" | "current_year" | "all"
  })
)
// Retorna: { totalRequests, completedRequests, totalProfit, ... }
```

#### `requests.getClientsForFilter`
```typescript
// Obtener lista de clientes para filtro
const { data } = useQuery(
  trpc.requests.getClientsForFilter.queryOptions()
)
// Retorna: Array<{ id, name, email }>
```

#### `requests.getUsers`
```typescript
// Obtener lista de usuarios para asignar
const { data } = useQuery(
  trpc.requests.getUsers.queryOptions()
)
// Retorna: Array<{ id, name }>
```

### Mutaciones (Mutations)

#### `requests.create`
```typescript
// Crear nuevo pedido
const mutation = useMutation({
  mutationFn: trpc.requests.create.mutate
})

mutation.mutate({
  description: "Descripción del pedido",
  email: "cliente@email.com",
  phone_number: "+51999999999",
  name: "Nombre Cliente"
})
// Retorna: { id: string, success: boolean }
```

#### `requests.updateStatus`
```typescript
// Cambiar estado del pedido
mutation.mutate({
  id: "uuid",
  status: "in_progress"
})
// Retorna: { success: boolean }
```

#### `requests.updateProduct`
```typescript
// Crear o actualizar producto
mutation.mutate({
  requestId: "uuid",
  product: {
    id: "uuid",
    title: "Producto",
    price: 100.00,
    base_price: 80.00,
    profit_amount: 20.00,
    weight: 1.5,
    source: "Amazon",
    description: "Descripción",
    imageData: "data:image/jpeg;base64,..." // Opcional
  }
})
// Retorna: { success, product, newProduct }
```

#### `requests.deleteSingleProduct`
```typescript
// Eliminar producto
mutation.mutate({
  requestId: "uuid",
  id: "product-uuid",
  image_url: "https://..."
})
// Retorna: { success: boolean }
```

#### `requests.updateAssignedUser`
```typescript
// Asignar usuario al pedido
mutation.mutate({
  requestId: "uuid",
  userId: "user-uuid" // null para desasignar
})
// Retorna: { success: boolean }
```

#### `requests.generateEmailText`
```typescript
// Generar texto de email con IA
mutation.mutate({
  clientName: "Juan Pérez",
  totalUSD: 150.00,
  totalPEN: 570.00
})
// Retorna: { email: string }
```

#### `requests.sendEmail`
```typescript
// Enviar email al cliente
mutation.mutate({
  id: "uuid",
  email: "cliente@email.com",
  subject: "Cotización de Pedido",
  content: "Contenido del email..."
})
// Retorna: { success: boolean, data: any }
```

#### `requests.updateRequest`
```typescript
// Actualizar información general del pedido
mutation.mutate({
  id: "uuid",
  price: 100.00,
  finalPrice: 120.00,
  response: "Respuesta al cliente",
  currency: "USD",
  exchangeRate: 3.80
})
// Retorna: { success: boolean }
```

---

## 🎨 Componentes Principales

### RequestsTable
**Props:** Ninguno (usa hooks internos)

**Features:**
- Paginación server-side
- Ordenamiento por columnas
- Filtrado en tiempo real
- Badges de estado con colores
- Copiar ID al portapapeles
- Link a detalle del pedido

**Columnas:**
1. ID de pedido (copiable)
2. Descripción (con link)
3. Cliente
4. Contacto (teléfono o email)
5. Estado (badge)
6. Asignado a
7. Acciones (dropdown)

### RequestsFilters
**Props:** Ninguno (usa hooks internos)

**Filtros:**
- Búsqueda de texto (debounced 500ms)
- Filtro por cliente (combobox)
- Filtro por estado (combobox)
- Botón limpiar filtros
- Botón agregar pedido

### RequestsKPIs
**Props:** Ninguno (usa hooks internos)

**Métricas:**
1. Total de Pedidos
2. Pedidos Completados
3. Ganancia Total (S/.)
4. Tasa de Conversión (%)
5. Ganancia Media por Pedido
6. Producto más Popular

**Períodos:**
- Este mes
- Mes pasado
- Este año
- Todo el tiempo

---

## 🔧 Hooks Personalizados

### useRequestFilters
```typescript
const { 
  filters,      // { status, clientId, text }
  setFilters,   // (updates) => void
  resetFilters, // () => void
  hasFilters    // boolean
} = useRequestFilters()

// Uso:
setFilters({ status: "pending" })
setFilters({ clientId: "uuid" })
setFilters({ text: "búsqueda" })
resetFilters()
```

### useRequestQuery
```typescript
const { data, isLoading, error } = useRequestQuery(id)
// Retorna: PurchaseRequest | null
```

---

## 📊 Tipos TypeScript

### PurchaseRequestStatus
```typescript
type PurchaseRequestStatus = 
  | "pending" 
  | "in_progress" 
  | "in_transit" 
  | "completed" 
  | "cancelled" 
  | "delivered"
```

### PurchaseRequest
```typescript
interface PurchaseRequest {
  id: string
  description: string
  status: PurchaseRequestStatus | null
  response?: string | null
  url?: string | null
  sub_total?: number | null
  weight?: number | null
  profit?: number | null
  shipping_cost?: number | null
  price?: number | null
  final_price?: number | null
  exchange_rate?: number
  currency?: string | null
  email_sent?: boolean | null
  whatsapp_sent?: boolean | null
  assigned_user: AssignedUser | null
  client: Client | null
  products: Product[]
  created_at: string | null
  updated_at: string | null
}
```

### Product
```typescript
interface Product {
  id: string
  request_id?: string
  title: string
  base_price?: number | null
  profit_amount?: number | null
  price: number
  tax?: number | null
  weight: number
  source: string
  description: string | null
  image_url: string | null
  imageData?: string | null
  created_at?: string | null
  updated_at?: string | null
}
```

### Client
```typescript
interface Client {
  email: string | null
  phone_number: string | null
  name?: string | null
}
```

---

## 🗄️ Esquema de Base de Datos

### purchase_requests
```sql
CREATE TABLE purchase_requests (
  id UUID PRIMARY KEY,
  description TEXT NOT NULL,
  status VARCHAR(20),
  response TEXT,
  url TEXT,
  price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  exchange_rate DECIMAL(10,4),
  currency VARCHAR(3),
  email_sent BOOLEAN,
  whatsapp_sent BOOLEAN,
  client_id UUID REFERENCES clients(id),
  assigned_user UUID REFERENCES users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### request_products
```sql
CREATE TABLE request_products (
  id UUID PRIMARY KEY,
  request_id UUID REFERENCES purchase_requests(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  base_price DECIMAL(10,2),
  profit_amount DECIMAL(10,2),
  tax DECIMAL(5,2),
  weight DECIMAL(10,2) NOT NULL,
  description TEXT,
  source VARCHAR(50) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

## 🔐 Variables de Entorno

```env
# OpenAI (Generación de emails)
OPENAI_API_KEY=sk-...

# Resend (Envío de emails)
RESEND_API_KEY=re_...
FROM_EMAIL=no-reply@dashboard.underla.lat

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Clerk (Autenticación)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚦 Flujos Comunes

### Crear un Pedido
1. Usuario hace click en "Agregar"
2. Completa formulario (descripción + email/teléfono)
3. Sistema valida datos
4. Sistema busca o crea cliente
5. Sistema crea pedido con estado "pending"
6. Redirige a detalle del pedido

### Cotizar un Pedido
1. Admin abre detalle del pedido
2. Agrega productos uno por uno
3. Sistema calcula precios automáticamente
4. Admin genera email con IA
5. Admin revisa y envía email
6. Sistema marca email_sent = true
7. Admin cambia estado a "in_progress"

### Completar un Pedido
1. Cliente aprueba cotización
2. Admin compra productos
3. Admin cambia estado a "in_transit"
4. Productos llegan a destino
5. Cliente recibe productos
6. Admin cambia estado a "delivered"

---

## 📝 Notas Importantes

### Paginación
- La paginación es **server-side**
- Page es **1-indexed** (primera página = 1)
- PageSize máximo = 100

### Filtros
- Los filtros se sincronizan con la URL
- El texto tiene debounce de 500ms
- Al cambiar filtros, se resetea a página 1

### Imágenes
- Las imágenes se suben como Base64
- Se convierten a Buffer en el servidor
- Se almacenan en Supabase Storage bucket "images"
- Carpeta: `products/{productId}.{ext}`

### Estados Finales
- `completed`, `delivered`, `cancelled` son estados finales
- No se recomienda cambiar desde estados finales

### Cálculos
- `profit_amount` = `price` - `base_price`
- `totalProfit` = SUM de todos los `profit_amount`
- `conversionRate` = `completedRequests` / `totalRequests`

---

## 🐛 Debugging

### Ver queries en consola
```typescript
// En el navegador
localStorage.setItem('debug', 'trpc:*')
```

### Ver estado de React Query
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Agregar en layout
<ReactQueryDevtools initialIsOpen={false} />
```

### Ver datos de Supabase
```typescript
// En requests.ts
console.log('Query result:', data)
console.log('Query error:', error)
```
