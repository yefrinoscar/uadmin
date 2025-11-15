# Documentación del Sistema de Pedidos (Requests)

Esta carpeta contiene la documentación completa del sistema de gestión de pedidos.

## 📚 Documentos Disponibles

### 1. [requests-system-overview.md](./requests-system-overview.md)
**Resumen general del sistema**
- Arquitectura completa
- Modelo de datos y relaciones
- Flujos de datos principales
- API endpoints con ejemplos
- Componentes frontend
- Estados del pedido
- Integraciones externas

### 2. [requests-visual-diagram.md](./requests-visual-diagram.md)
**Diagramas visuales con Mermaid**
- Diagrama de arquitectura completa
- Flujos de secuencia (creación, listado, productos, email)
- Modelo de datos con relaciones
- Máquina de estados
- Jerarquía de componentes
- Journey del usuario
- Cálculos de métricas

### 3. [requests-quick-reference.md](./requests-quick-reference.md)
**Guía rápida de referencia**
- Archivos principales del proyecto
- Estados del pedido (tabla de referencia)
- API endpoints con código de ejemplo
- Componentes y sus props
- Hooks personalizados
- Tipos TypeScript
- Esquema de base de datos
- Variables de entorno
- Flujos comunes
- Tips de debugging

## 🎯 Cómo Usar Esta Documentación

### Para Desarrolladores Nuevos
1. Empieza con **requests-system-overview.md** para entender la arquitectura
2. Revisa **requests-visual-diagram.md** para ver los flujos visuales
3. Usa **requests-quick-reference.md** como referencia durante el desarrollo

### Para Desarrolladores Experimentados
- Usa **requests-quick-reference.md** como cheat sheet
- Consulta **requests-visual-diagram.md** para entender flujos complejos
- Revisa **requests-system-overview.md** para detalles de implementación

### Para Product Managers
- **requests-visual-diagram.md** - Journey del usuario y flujos de negocio
- **requests-system-overview.md** - Estados del pedido y funcionalidades

## 🔍 Búsqueda Rápida

### Quiero saber sobre...

**Estados del pedido**
→ [quick-reference.md#estados-del-pedido](./requests-quick-reference.md#-estados-del-pedido)

**API endpoints**
→ [quick-reference.md#api-endpoints-principales](./requests-quick-reference.md#-api-endpoints-principales)

**Componentes**
→ [quick-reference.md#componentes-principales](./requests-quick-reference.md#-componentes-principales)

**Base de datos**
→ [system-overview.md#modelo-de-datos](./requests-system-overview.md#️-modelo-de-datos)

**Flujos de datos**
→ [visual-diagram.md#flujos](./requests-visual-diagram.md#-flujo-de-creación-de-pedido)

**Tipos TypeScript**
→ [quick-reference.md#tipos-typescript](./requests-quick-reference.md#-tipos-typescript)

## 📊 Resumen Ejecutivo

### Sistema de Pedidos
El sistema de pedidos permite gestionar el ciclo completo de ventas desde la solicitud inicial hasta la entrega final.

**Características principales:**
- ✅ Gestión de pedidos con 6 estados
- ✅ Cotización de productos con cálculo automático de ganancias
- ✅ Generación de emails con IA (OpenAI)
- ✅ Envío de emails transaccionales (Resend)
- ✅ Filtrado y búsqueda avanzada
- ✅ KPIs y estadísticas en tiempo real
- ✅ Asignación de pedidos a usuarios
- ✅ Gestión de productos con imágenes
- ✅ Paginación server-side

**Tecnologías:**
- Frontend: Next.js 14 (App Router), React, TailwindCSS, shadcn/ui
- Backend: tRPC, Supabase (PostgreSQL)
- Autenticación: Clerk
- IA: OpenAI GPT-4o-mini
- Email: Resend
- Storage: Supabase Storage

**Métricas del código:**
- Router tRPC: 1,126 líneas
- Componentes: 15+ archivos
- API Endpoints: 16 endpoints
- Estados: 6 estados de pedido

## 🔄 Actualizaciones

**Última actualización:** 15 de noviembre, 2024

**Cambios recientes:**
- ✅ Documentación completa creada
- ✅ Diagramas visuales con Mermaid
- ✅ Guía de referencia rápida
- ✅ Ejemplos de código para todos los endpoints

## 📞 Contacto

Para preguntas o sugerencias sobre esta documentación, contacta al equipo de desarrollo.

---

**Nota:** Esta documentación se genera automáticamente a partir del código fuente. Mantén el código actualizado para que la documentación refleje el estado actual del sistema.
