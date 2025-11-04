# AI Context Rules

This folder contains all development rules and guidelines for AI assistants.

## How It Works

All AI assistants (Cursor, Windsurf, Copilot, Claude, etc.) will read these rules automatically.

## Structure

- `core.md` - Core development principles
- `api.md` - API development patterns
- `database.md` - Database rules
- `components.md` - React component guidelines
- `state.md` - State management rules
- `security.md` - Security best practices
- `features/` - Feature-specific rules

## Adding New Rules

When creating a new feature or module, add a new file in this folder or in `features/` subfolder.

Example:
```
.aicontext/
├── features/
│   ├── exchange-rate.md
│   ├── collections.md
│   └── requests.md
```

All AI assistants will automatically read and follow these rules.
