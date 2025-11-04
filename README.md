# uadmin - Purchase Request Management System

Admin dashboard for managing purchase requests, collections, and exchange rates.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Clerk
- **API**: tRPC + REST APIs
- **State**: Zustand + React Query
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel

## Project Structure

```
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   ├── api/                  # REST API endpoints
│   └── sign-in/              # Auth pages
├── components/
│   └── ui/                   # shadcn/ui components
├── trpc/
│   └── api/routers/          # tRPC routers
├── store/                    # Zustand stores
├── lib/                      # Utilities
├── supabase/migrations/      # Database migrations
└── docs/                     # Documentation (if needed)
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Supabase account
- Clerk account

### Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# APIs
DECOLECTA_API_KEY=your_decolecta_key
CRON_SECRET=your_cron_secret

# Shopify (optional)
SHOPIFY_STORE_DOMAIN=your_store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_access_token
```

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Development Rules

See `.aicontext/` folder for all development guidelines organized by topic.

- Core principles: `.aicontext/core.md`
- API patterns: `.aicontext/api.md`
- Database rules: `.aicontext/database.md`
- Components: `.aicontext/components.md`
- State management: `.aicontext/state.md`
- Security: `.aicontext/security.md`
- Features: `.aicontext/features/`

### Key Patterns

**APIs**: Use `createAuthenticatedClient()` + `corsHeaders`  
**State**: Zustand for global, React Query for server  
**Components**: Server-first, "use client" when needed  
**Database**: Always Supabase, proper error handling

## Features

- 📋 Purchase Request Management
- 💱 Exchange Rate System (auto-updated daily)
- 🏪 Shopify Collections Integration
- 👥 Client Management
- 📦 Product Tracking
- 🔐 Role-based Access Control

## API Documentation

### Public APIs

- `GET /api/exchange-rate/current` - Current exchange rate
- `GET /api/requests` - Create purchase request
- `GET /api/promotions` - Promotions data

### Protected APIs

All dashboard APIs require authentication via Clerk.

## Database

Migrations in `supabase/migrations/`

Run migrations:
```bash
supabase db push
```

## Deployment

Deployed on Vercel with automatic deployments from main branch.

### Cron Jobs

- Exchange rate update: Daily at 9 AM Peru time (14:00 UTC)

## Contributing

1. Follow `.cursorrules` patterns
2. Fix all errors before committing
3. Test changes locally
4. Write clear commit messages

## License

Private project
