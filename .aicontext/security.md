# Security Best Practices

## Authentication
- Use Clerk for authentication
- Protect routes with middleware
- Validate user permissions
- Never expose sensitive data

## Data Exposure
- Only SELECT necessary fields (never SELECT *)
- Filter by published/active status
- Validate all inputs
- Sanitize user data

## Environment Variables
- Store secrets in `.env.local`
- Never commit `.env.local`
- Use proper variable names (UPPERCASE_WITH_UNDERSCORES)
- Document required variables in README

## API Security
- Add routes to middleware for public access
- Use authorization headers for protected endpoints
- Validate all input parameters
- Return appropriate error messages (don't expose internals)

## Example
```typescript
// Good - minimal exposure
.select('handle, banner_url, video_url')

// Bad - too much data
.select('*')
```

## CORS
- Always include corsHeaders in API responses
- Use `@/lib/cors` for consistency
- Include in success, error, and OPTIONS responses
