# React

React 19 with the Vite plugin. Entry is `src/main.tsx`, which mounts `App` from
`src/app.tsx` in `StrictMode`.

## Structure

`src/` grows by role as the app does: `components/`, `hooks/`, `utils/`,
`pages/`, `providers/`. Feature-scoped code lives under `features/<name>/` and
mirrors that same layout. Put code in the feature folder unless two features
share it.

## Components

- **Container / presentational**: containers fetch data and hold logic;
  presentational components take props and return JSX with no side effects.
- Props are wrapped in `Readonly<>`:
  `export function UserCard({ name }: Readonly<UserCardProps>)`.
- Conditional rendering uses a ternary (`isOpen ? <Panel /> : null`), never
  `&&` — a falsy number renders as `0`.
- Every component exports inline. `default` export is reserved for route-level
  page components.
- Shared state lives in a context provider under `providers/`. Reach for
  context only once prop-passing spans three levels.

## Hooks

Custom hooks are named `use-<thing>.ts` and return an object, not a positional
tuple, once they return more than two values. Every effect declares its full
dependency array; an effect with no cleanup and no async work is usually a
render-time computation instead.
