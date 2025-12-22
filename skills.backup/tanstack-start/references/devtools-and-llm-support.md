# Devtools, DX, and LLM Support

## Router Devtools
- Install `@tanstack/router-devtools` and render `<RouterDevtools />` in `__root.tsx` during development.
- Use it to inspect route matches, loader/action states, search params, and preloading; keep it disabled in production builds.

## ESLint + Property Order
- Add `@tanstack/eslint-plugin-router` with the recommended config; it enforces the inference-sensitive property order (`beforeLoad` → `loader` → `component`).
- Pair with `typescript-eslint` strict rules to catch missing params/search typings early.

## DX Decisions
- Prefer file-based routes for co-location and automatic code-splitting; switch to code-based only when composition or dynamic route sets are required.
- Keep loaders pure and colocated; move heavy dependencies behind lazy imports to shrink critical path.

## LLM Support (experimental)
- The router exposes typed route metadata that can be serialized for LLM agents; keep route descriptions concise and deterministic.
- Provide friendly names in route meta for improved grounding (e.g., `meta: { title: 'Billing Settings' }`).
- Avoid dynamic titles that depend on user data unless you guard them with authentication checks to prevent leaking context.
