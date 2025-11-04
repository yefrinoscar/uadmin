# API Development Rules

## Required Pattern

```typescript
import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabase-client';
import { corsHeaders } from '@/lib/cors';

export async function GET(request: Request) {
  try {
    const supabase = createAuthenticatedClient();
    
    const { data, error } = await supabase
      .from('table')
      .select('field1, field2')
      .eq('published', true);
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Not found', message: 'Resource not found' },
          { status: 404, headers: corsHeaders }
        );
      }
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      data: data
    }, { headers: corsHeaders });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Error message', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
```

## NEVER
- ❌ Direct `createClient()` from Supabase
- ❌ Hardcoded CORS headers
- ❌ Missing OPTIONS method
- ❌ SELECT * in queries
- ❌ Missing corsHeaders in responses

## ALWAYS
- ✅ Use `createAuthenticatedClient()`
- ✅ Import `corsHeaders` from `@/lib/cors`
- ✅ Include OPTIONS method
- ✅ Add corsHeaders to ALL responses
- ✅ Handle PGRST116 error
- ✅ Specify exact fields in SELECT

## Response Format
- Success: `{ success: true, data: {...} }`
- Error: `{ error: "message", details: "..." }`

## Public Routes
Add to `middleware.ts`:
```typescript
const isPublicRoute = createRouteMatcher([
  '/api/your-route(.*)'
])
```

## Reference
- Simple GET: `app/api/exchange-rate/current/route.ts`
- With auth: `app/api/exchange-rate/cron/route.ts`
- POST: `app/api/requests/route.ts`
