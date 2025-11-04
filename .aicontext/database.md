# Database Rules

## Supabase
- ALWAYS use Supabase for database operations
- Use `createAuthenticatedClient()` from `@/lib/supabase-client`
- NEVER use direct `createClient()` from Supabase

## Error Handling
- Always handle database errors
- Check for PGRST116 error code (not found)
- Return appropriate error messages

## Queries
- NEVER use SELECT * - always specify fields
- Filter by published/active status when appropriate
- Use proper TypeScript types for queries

## Migrations
- Create migrations for schema changes
- Store in `supabase/migrations/`
- Use descriptive names with dates (YYYYMMDD_description.sql)

## Example
```typescript
const supabase = createAuthenticatedClient();

const { data, error } = await supabase
  .from('table')
  .select('field1, field2, field3')
  .eq('published', true);

if (error) {
  if (error.code === 'PGRST116') {
    // Handle not found
  }
  throw error;
}
```
