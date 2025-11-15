# Sistema de Pedidos - Diagramas Visuales

## 🎯 Diagrama de Arquitectura Completa

```mermaid
graph TB
    subgraph "Frontend - Next.js App Router"
        A[RequestsPage] --> B[RequestsKPIs]
        A --> C[RequestsFilters]
        A --> D[RequestsTable]
        A --> E[AddRequestDialog]
        
        F[RequestDetailPage] --> G[RequestDetail]
        G --> H[RequestDetailsCard]
        G --> I[ProductList]
        G --> J[EmailSection]
    end
    
    subgraph "State Management"
        K[useRequestFilters Hook]
        L[tRPC Client]
        M[React Query Cache]
    end
    
    subgraph "API Layer - tRPC"
        N[requests.getAll]
        O[requests.getById]
        P[requests.create]
        Q[requests.updateStatus]
        R[requests.updateProduct]
        S[requests.sendEmail]
        T[requests.getStats]
    end
    
    subgraph "External Services"
        U[OpenAI API]
        V[Resend API]
        W[Supabase Storage]
    end
    
    subgraph "Database - Supabase"
        X[(purchase_requests)]
        Y[(request_products)]
        Z[(clients)]
        AA[(users)]
    end
    
    D --> L
    G --> L
    L --> N
    L --> O
    L --> P
    L --> Q
    L --> R
    L --> S
    L --> T
    
    N --> X
    O --> X
    O --> Y
    P --> X
    Q --> X
    R --> Y
    
    S --> V
    S --> U
    R --> W
    
    X --> Z
    X --> AA
    Y --> X
```

## 🔄 Flujo de Creación de Pedido

```mermaid
sequenceDiagram
    participant U as Usuario
    participant D as AddRequestDialog
    participant T as tRPC Client
    participant A as API /api/requests
    participant DB as Supabase DB
    
    U->>D: Click "Agregar Pedido"
    D->>U: Muestra formulario
    U->>D: Completa datos (descripción, email/teléfono)
    D->>D: Validación con Zod
    D->>T: tRPC.requests.create()
    T->>A: POST /api/requests
    A->>DB: Buscar/Crear cliente
    A->>DB: INSERT purchase_request
    DB-->>A: Retorna ID
    A-->>T: { id, success: true }
    T-->>D: Actualiza cache
    D-->>U: Muestra éxito + Redirige
```

## 📊 Flujo de Listado con Filtros

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as RequestsFilters
    participant T as RequestsTable
    participant Q as React Query
    participant API as tRPC API
    participant DB as Supabase
    
    U->>F: Cambia filtro (status/client/text)
    F->>F: Debounce 500ms (text)
    F->>F: Update URL params
    F->>T: Trigger re-render
    T->>Q: Query con nuevos filtros
    Q->>API: requests.getAll(filters, pagination)
    API->>DB: SELECT con WHERE + LIMIT + OFFSET
    DB-->>API: { items, totalCount }
    API-->>Q: Retorna datos
    Q->>Q: Actualiza cache
    Q-->>T: Nuevos datos
    T-->>U: Muestra tabla actualizada
```

## 🛍️ Flujo de Gestión de Productos

```mermaid
sequenceDiagram
    participant U as Usuario
    participant PF as ProductForm
    participant T as tRPC
    participant S as Supabase Storage
    participant DB as Supabase DB
    
    U->>PF: Edita producto
    U->>PF: Selecciona imagen
    PF->>PF: Convierte a Base64
    U->>PF: Click "Guardar"
    PF->>T: updateProduct({ product, imageData })
    
    alt Tiene imagen nueva
        T->>S: Upload imagen (Buffer)
        S-->>T: Retorna public URL
    end
    
    T->>DB: Verifica si producto existe
    
    alt Producto existe
        T->>DB: UPDATE request_products
    else Producto nuevo
        T->>DB: INSERT request_products
    end
    
    DB-->>T: { success, product }
    T-->>PF: Actualiza UI
    PF-->>U: Muestra éxito
```

## 📧 Flujo de Envío de Email

```mermaid
sequenceDiagram
    participant U as Usuario
    participant E as EmailSection
    participant T as tRPC
    participant O as OpenAI API
    participant R as Resend API
    participant DB as Supabase
    
    U->>E: Click "Generar Email"
    E->>T: generateEmailText({ clientName, totalUSD, totalPEN })
    T->>O: Chat completion request
    O-->>T: Email generado
    T-->>E: { email: "..." }
    E-->>U: Muestra email editable
    
    U->>E: Revisa/edita email
    U->>E: Click "Enviar"
    E->>T: sendEmail({ id, email, subject, content })
    T->>R: emails.send()
    R-->>T: { success, data }
    T->>DB: UPDATE email_sent = true
    DB-->>T: Success
    T-->>E: { success: true }
    E-->>U: Muestra confirmación
```

## 📈 Flujo de KPIs y Estadísticas

```mermaid
sequenceDiagram
    participant U as Usuario
    participant K as RequestsKPIs
    participant T as tRPC
    participant DB as Supabase
    
    U->>K: Selecciona período (mes/año/todo)
    K->>T: getStats({ period })
    
    T->>DB: Query purchase_requests (con filtro fecha)
    T->>DB: Query request_products (con filtro fecha)
    
    par Cálculos en paralelo
        T->>T: COUNT total requests
        T->>T: COUNT completed requests
        T->>T: SUM profit_amount
        T->>T: AVG profit per request
        T->>T: Calcular conversion rate
        T->>T: GROUP BY product title
    end
    
    DB-->>T: Datos agregados
    T-->>K: { totalRequests, completedRequests, totalProfit, ... }
    K-->>U: Actualiza tarjetas de métricas
```

## 🗄️ Modelo de Datos - Relaciones

```mermaid
erDiagram
    CLIENTS ||--o{ PURCHASE_REQUESTS : "has"
    USERS ||--o{ PURCHASE_REQUESTS : "assigned_to"
    PURCHASE_REQUESTS ||--o{ REQUEST_PRODUCTS : "contains"
    
    CLIENTS {
        uuid id PK
        string name
        string email
        string phone_number
        timestamp created_at
        timestamp updated_at
    }
    
    USERS {
        uuid id PK
        string name
        string email
        timestamp created_at
    }
    
    PURCHASE_REQUESTS {
        uuid id PK
        text description
        enum status
        text response
        decimal price
        decimal final_price
        decimal exchange_rate
        string currency
        boolean email_sent
        boolean whatsapp_sent
        uuid client_id FK
        uuid assigned_user FK
        timestamp created_at
        timestamp updated_at
    }
    
    REQUEST_PRODUCTS {
        uuid id PK
        uuid request_id FK
        string title
        decimal price
        decimal base_price
        decimal profit_amount
        decimal weight
        string source
        text image_url
        timestamp created_at
        timestamp updated_at
    }
```

## 🔄 Máquina de Estados

```mermaid
stateDiagram-v2
    [*] --> pending: Crear pedido
    
    pending --> in_progress: Iniciar procesamiento
    pending --> cancelled: Cancelar
    
    in_progress --> in_transit: Productos comprados
    in_progress --> cancelled: Cancelar
    
    in_transit --> delivered: Entrega confirmada
    in_transit --> completed: Marcar completado
    in_transit --> cancelled: Cancelar
    
    delivered --> [*]
    completed --> [*]
    cancelled --> [*]
    
    note right of pending
        Estado inicial
        Cliente acaba de solicitar
    end note
    
    note right of in_progress
        Admin cotizando
        Email enviado
    end note
    
    note right of in_transit
        Productos en camino
        Tracking activo
    end note
    
    note right of delivered
        Cliente recibió productos
        Estado final exitoso
    end note
```

## 🎨 Componentes - Jerarquía

```mermaid
graph TD
    A[RequestsPage] --> B[HydrateClient]
    B --> C[RequestsKPIs]
    B --> D[RequestsFilters]
    B --> E[Suspense]
    E --> F[RequestsTable]
    
    D --> G[StatusComboBox]
    D --> H[ClientComboBox]
    D --> I[TextSearch Input]
    D --> J[AddRequestDialog]
    
    F --> K[Table Header]
    F --> L[Table Body]
    F --> M[Pagination]
    
    L --> N[StatusBadge]
    L --> O[RequestIdCell]
    L --> P[ActionsDropdown]
    
    C --> Q[KPI Card x6]
    C --> R[Period Tabs]
    
    style A fill:#e1f5ff
    style C fill:#fff4e6
    style D fill:#f3e5f5
    style F fill:#e8f5e9
```

## 📱 Flujo de Usuario - Caso de Uso Completo

```mermaid
journey
    title Ciclo de Vida de un Pedido
    section Creación
      Cliente solicita pedido: 5: Cliente
      Admin recibe notificación: 3: Admin
      Admin revisa pedido: 4: Admin
    section Cotización
      Admin busca productos: 4: Admin
      Admin calcula precios: 4: Admin
      Sistema genera email: 5: Sistema
      Admin envía cotización: 5: Admin
    section Aprobación
      Cliente recibe email: 5: Cliente
      Cliente aprueba: 5: Cliente
      Cliente realiza pago: 4: Cliente
    section Compra
      Admin compra productos: 4: Admin
      Admin actualiza estado: 4: Admin
      Productos en tránsito: 3: Sistema
    section Entrega
      Productos llegan a Miami: 4: Sistema
      Envío a Perú: 3: Sistema
      Cliente recibe productos: 5: Cliente
      Admin marca como entregado: 5: Admin
```

## 🔐 Seguridad y Permisos

```mermaid
graph LR
    A[Usuario] --> B{Autenticado?}
    B -->|No| C[Redirect a Login]
    B -->|Sí| D{Tiene rol?}
    
    D -->|authenticated| E[Acceso a Requests]
    D -->|No| C
    
    E --> F[Row Level Security]
    F --> G[Puede ver todos los requests]
    F --> H[Puede crear requests]
    F --> I[Puede actualizar requests]
    F --> J[Puede eliminar products]
    
    style B fill:#ffebee
    style D fill:#fff3e0
    style F fill:#e8f5e9
```

## 📊 Métricas y KPIs - Cálculos

```mermaid
graph TD
    A[Datos Raw] --> B[purchase_requests]
    A --> C[request_products]
    
    B --> D[Total Requests]
    B --> E[Completed Requests]
    
    D --> F[Conversion Rate]
    E --> F
    
    C --> G[Sum profit_amount]
    G --> H[Total Profit]
    
    H --> I[Avg Profit per Request]
    E --> I
    
    C --> J[Group by title]
    J --> K[Count per product]
    K --> L[Top Products]
    
    style A fill:#e3f2fd
    style H fill:#c8e6c9
    style F fill:#fff9c4
    style L fill:#f8bbd0
```
