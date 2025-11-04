# State Management Rules

## Zustand (Global State)
- Use for global application state
- Store in `store/` directory
- Follow existing store patterns

## React Query (Server State)
- Use for server data fetching
- Use with tRPC
- Implement proper caching strategies

## Local State
- Use useState for UI state only
- Keep state as local as possible
- Don't lift state unnecessarily

## tRPC
- Create routers in `trpc/api/routers/`
- Use `protectedProcedure` for authenticated routes
- Use `publicProcedure` for public routes
- Define schemas with Zod
- Handle errors with TRPCError

## Example Zustand Store
```typescript
import { create } from 'zustand';

interface MyStore {
  value: string;
  setValue: (value: string) => void;
}

export const useMyStore = create<MyStore>((set) => ({
  value: '',
  setValue: (value) => set({ value }),
}));
```

## Reference
- Store example: `store/requestDetailStore.ts`
- tRPC routers: `trpc/api/routers/*.ts`
