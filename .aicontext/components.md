# Component Development Rules

## React Components
- Use "use client" directive only when needed
- Prefer server components by default
- Use proper TypeScript types/interfaces
- Extract reusable logic to custom hooks
- Keep components focused and small

## Styling
- Use Tailwind CSS classes
- Use shadcn/ui components when available
- Keep styles consistent with project
- No inline styles unless absolutely necessary

## Props
- Define proper TypeScript interfaces for props
- Use destructuring for props
- Provide default values when appropriate

## Example
```typescript
interface MyComponentProps {
  title: string;
  description?: string;
  onAction: () => void;
}

export function MyComponent({ title, description, onAction }: MyComponentProps) {
  return (
    <div className="p-4">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      <button onClick={onAction}>Action</button>
    </div>
  );
}
```

## Reference
- Complex components: `app/(dashboard)/dashboard/requests/[id]/components/`
- UI components: `components/ui/`
