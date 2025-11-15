# Sistema de Pedidos (Requests) - Documentación Completa

## 📋 Índice
1. [Arquitectura General](#arquitectura-general)
2. [Modelo de Datos](#modelo-de-datos)
3. [Flujo de Datos](#flujo-de-datos)
4. [API Endpoints](#api-endpoints)
5. [Componentes Frontend](#componentes-frontend)
6. [Estados del Pedido](#estados-del-pedido)

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ RequestsPage │  │ RequestDetail│  │ AddRequest   │          │
│  │   (List)     │  │    (Detail)  │  │   Dialog     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│  ┌──────▼──────────────────▼──────────────────▼───────┐         │
│  │           RequestsTable Component                    │         │
│  │  - Pagination  - Sorting  - Filtering               │         │
│  └──────────────────────┬───────────────────────────────┘        │
│                         │                                         │
│  ┌──────────────────────▼───────────────────────────────┐        │
│  │              RequestsFilters Component                │        │
│  │  - Text Search  - Client Filter  - Status Filter     │        │
│  └──────────────────────┬───────────────────────────────┘        │
│                         │                                         │
│  ┌──────────────────────▼───────────────────────────────┐        │
│  │                RequestsKPIs Component                 │        │
│  │  - Total Requests  - Completed  - Profit  - Conv.    │        │
│  └──────────────────────┬───────────────────────────────┘        │
└─────────────────────────┼─────────────────────────────────────────┘
                          │ tRPC Client
┌─────────────────────────▼─────────────────────────────────────────┐
│                     API LAYER (tRPC Router)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              requests.ts Router                           │   │
│  │  - getAll()           - getById()                        │   │
│  │  - create()           - updateStatus()                   │   │
│  │  - updateResponse()   - updateProduct()                  │   │
│  │  - sendEmail()        - generateEmailText()              │   │
│  │  - getStats()         - getTimeSeriesStats()             │   │
│  └──────────────────────┬───────────────────────────────────┘   │
└─────────────────────────┼─────────────────────────────────────────┘
                          │ Supabase Client
┌─────────────────────────▼─────────────────────────────────────────┐
│                    DATABASE (Supabase/PostgreSQL)                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ purchase_requests│  │ request_products │  │   clients    │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │      users       │  │  storage.images  │                     │
│  └──────────────────┘  └──────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Modelo de Datos

### Tabla: `purchase_requests`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary Key |
| description | TEXT | Descripción del pedido |
| status | ENUM | Estado (pending, in_progress, in_transit, completed, cancelled, delivered) |
| response | TEXT | Respuesta/cotización |
| url | TEXT | URL de referencia |
| price | DECIMAL(10,2) | Precio |
| final_price | DECIMAL(10,2) | Precio final |
| sub_total | DECIMAL(10,2) | Subtotal |
| weight | DECIMAL(10,2) | Peso total |
| profit | DECIMAL(10,2) | Ganancia |
| shipping_cost | DECIMAL(10,2) | Costo de envío |
| exchange_rate | DECIMAL(10,4) | Tipo de cambio |
| currency | VARCHAR(3) | Moneda |
| email_sent | BOOLEAN | Email enviado |
| whatsapp_sent | BOOLEAN | WhatsApp enviado |
| client_id | UUID | FK a clients |
| assigned_user | UUID | FK a users |
| created_at | TIMESTAMP | Fecha creación |
| updated_at | TIMESTAMP | Fecha actualización |

### Tabla: `request_products`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary Key |
| request_id | UUID | FK a purchase_requests (CASCADE) |
| product_id | UUID | ID del producto |
| title | VARCHAR(255) | Nombre del producto |
| price | DECIMAL(10,2) | Precio final |
| base_price | DECIMAL(10,2) | Precio base |
| profit_amount | DECIMAL(10,2) | Ganancia |
| tax | DECIMAL(5,2) | Impuesto (%) |
| weight | DECIMAL(10,2) | Peso |
| description | TEXT | Descripción |
| source | VARCHAR(50) | Origen (Amazon, eBay, etc.) |
| image_url | TEXT | URL de imagen |
| created_at | TIMESTAMP | Fecha creación |
| updated_at | TIMESTAMP | Fecha actualización |

### Relaciones

```
clients (1) ──────< (N) purchase_requests (N) >────── (1) users
                              │
                              │ (1)
                              │
                              │ (N)
                              ▼
                      request_products
```

---

## 🔄 Flujo de Datos

### 1. Creación de Pedido
```
Usuario → AddRequestDialog → tRPC.create() → API /api/requests → Supabase
```

### 2. Listado con Filtros
```
RequestsPage → RequestsFilters → tRPC.getAll(filters, pagination) → Supabase Query
```

### 3. Detalle de Pedido
```
RequestDetail → tRPC.getById(id) → Supabase JOIN (clients, users, products)
```

### 4. Actualización de Estado
```
Usuario → Status Dropdown → tRPC.updateStatus() → UPDATE purchase_requests
```

### 5. Gestión de Productos
```
Usuario → Product Form → tRPC.updateProduct() → Image Upload → Supabase Storage → UPDATE/INSERT request_products
```

### 6. Envío de Email
```
Usuario → Generate Email → OpenAI API → Email Content → Resend API → UPDATE email_sent
```

---

## 🔌 API Endpoints (tRPC)

### `requests.getAll`
**Input:** `{ page, pageSize, filters: { status, clientId, text } }`  
**Output:** `{ items: PurchaseRequestList[], totalCount: number }`

### `requests.getById`
**Input:** `{ id: string }`  
**Output:** `PurchaseRequest | null`

### `requests.create`
**Input:** `{ description, email?, phone_number?, name?, user_id? }`  
**Output:** `{ id: string, success: boolean }`

### `requests.updateStatus`
**Input:** `{ id, status }`  
**Output:** `{ success: boolean }`

### `requests.updateProduct`
**Input:** `{ requestId, product }`  
**Output:** `{ success, product, newProduct }`

### `requests.sendEmail`
**Input:** `{ id, email, subject, content }`  
**Output:** `{ success, data }`

### `requests.getStats`
**Input:** `{ period: "current_month" | "last_month" | "current_year" | "all" }`  
**Output:** `{ totalRequests, completedRequests, totalProfit, avgProfitPerRequest, conversionRate, topProducts }`

---

## 🎨 Componentes Frontend

### Estructura de Archivos
```
app/(dashboard)/dashboard/requests/
├── page.tsx                          # Página principal
├── types.ts                          # Tipos TypeScript
├── [id]/
│   ├── page.tsx                      # Detalle del pedido
│   └── components/
│       ├── RequestDetail.tsx
│       ├── RequestDetailsCard.tsx
│       └── RequestSkeleton.tsx
├── _components/
│   ├── requests-table.tsx            # Tabla principal
│   ├── requests-kpis.tsx             # KPIs
│   ├── RequestsFilters.tsx           # Filtros
│   └── AddRequestDialog.tsx          # Crear pedido
└── hooks/
    ├── useRequestFilters.ts          # Hook filtros
    └── use-requests.ts               # Hook queries
```

### RequestsTable Features
- ✅ Paginación server-side
- ✅ Ordenamiento por columnas
- ✅ Filtrado en tiempo real
- ✅ Badges de estado con colores
- ✅ Copiar ID al portapapeles

### RequestsFilters
1. **Búsqueda de texto** (debounced 500ms)
2. **Filtro por cliente** (combobox)
3. **Filtro por estado** (combobox)
4. **Botón limpiar filtros**
5. **Botón agregar pedido**

### RequestsKPIs
1. Total de Pedidos
2. Pedidos Completados
3. Ganancia Total (PEN)
4. Tasa de Conversión (%)
5. Ganancia Media
6. Producto más Popular

---

## 📊 Estados del Pedido

### Diagrama de Transición
```
pending → in_progress → in_transit → delivered
                    ↓
                cancelled
```

### Estados Disponibles

| Estado | Label | Color | Icono | Descripción |
|--------|-------|-------|-------|-------------|
| pending | Pendiente | Amarillo | Clock | Pedido recién creado |
| in_progress | En Proceso | Azul | Loader2 | Procesando cotización |
| in_transit | En Camino | Violeta | Truck | Productos en tránsito |
| completed | Completado | Verde | CheckCircle2 | Pedido finalizado |
| cancelled | Cancelado | Rojo | XCircle | Pedido cancelado |
| delivered | Entregado | Verde azulado | CheckCircle2 | Entregado al cliente |

---

## 🔗 Integraciones Externas

### OpenAI API
- **Uso:** Generación de texto de email
- **Modelo:** gpt-4o-mini
- **Variable:** `OPENAI_API_KEY`

### Resend API
- **Uso:** Envío de emails transaccionales
- **Variable:** `RESEND_API_KEY`, `FROM_EMAIL`

### Supabase
- **Database:** PostgreSQL con RLS
- **Storage:** Bucket `images` para productos
- **Auth:** Integración con Clerk

---

## 📝 Tipos TypeScript Principales

```typescript
type PurchaseRequestStatus = 
  | "pending" 
  | "in_progress" 
  | "in_transit" 
  | "completed" 
  | "cancelled" 
  | "delivered"

interface PurchaseRequest {
  id: string
  description: string
  status: PurchaseRequestStatus
  response?: string
  price?: number
  final_price?: number
  client: Client | null
  assigned_user: AssignedUser | null
  products: Product[]
  created_at: string
  updated_at: string
}

interface Product {
  id: string
  title: string
  price: number
  base_price?: number
  profit_amount?: number
  weight: number
  source: string
  image_url?: string
}
```
