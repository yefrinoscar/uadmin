# React Component Rules

## Avoiding Unnecessary `useEffect`

1. **Prefer derived values.** If a value can be calculated directly from props, local state setters, or selectors, compute it inline (memoized if needed) instead of mirroring it into state via `useEffect`.
2. **Sync state on user intent only.** Only reach for `useEffect` when you truly need to respond to external changes (e.g., subscriptions, timers, async calls). Simple formatting (like `setState(prop.toFixed(2))`) should happen inside event handlers or derived helpers.
3. **Let stores drive updates.** When using Zustand/React Query, subscribe to the store or query result directly. Avoid `useEffect` that reads from the store and writes into another piece of state just to keep them “in sync.”
4. **Centralize side effects.** Keep effects limited to data fetching, subscriptions, and DOM/animation hooks. Any effect that only sets state based on other state is a code smell and should be refactored.
5. **No debug effects.** Don’t use `useEffect` just to `console.log` store values—surface temporary diagnostics inline (e.g., a collapsible `<pre>` panel) so they’re easy to locate and remove.

### Example

❌ Anti-pattern:
```tsx
useEffect(() => {
  setTotalProfitInput(totalProfitUSD.toFixed(2));
}, [totalProfitUSD]);
```

✅ Preferred:
```tsx
const totalProfitInput = useMemo(() => totalProfitUSD.toFixed(2), [totalProfitUSD]);
```

Or update the input only when the user submits/changes it, without mirroring every prop change through an effect.

> **Rule of thumb:** if the effect’s dependency list contains only values that already exist in your component, consider computing the result directly or moving the logic into the source that changes.
