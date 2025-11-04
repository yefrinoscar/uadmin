# Development Rules

**📁 All rules are organized in `.aicontext/` folder**

## Rule Files

### Core Rules
- `.aicontext/core.md` - Core development principles
- `.aicontext/api.md` - API development patterns
- `.aicontext/database.md` - Database rules (Supabase)
- `.aicontext/components.md` - React component guidelines
- `.aicontext/state.md` - State management (Zustand, React Query, tRPC)
- `.aicontext/security.md` - Security best practices

### Feature-Specific Rules
- `.aicontext/features/exchange-rate.md` - Exchange rate system

## Adding New Rules

When creating a new feature or module, add a new file:
```
.aicontext/features/your-feature.md
```

All AI assistants (Cursor, Windsurf, Copilot, Claude, etc.) will automatically read these files.
