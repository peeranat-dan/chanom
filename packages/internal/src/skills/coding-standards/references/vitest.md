# Vitest

Tests run on jsdom with globals enabled — `describe`, `it`, `expect`, and `vi`
need no import. `src/test-setup.ts` loads `@testing-library/jest-dom/vitest`, so
its matchers are available everywhere. Run with `pnpm test`, or `pnpm test:watch`
while iterating.

## Layout

Tests are colocated and named `*.test.ts` / `*.test.tsx`, sitting beside the
file they cover: `src/app.tsx` → `src/app.test.tsx`.

## Component tests

Testing Library with `user-event`, querying by role and accessible name:

```tsx
describe('UserCard', () => {
  it('should render the user name correctly', () => {
    render(<UserCard name="Ada" />);
    expect(screen.getByRole('heading', { name: 'Ada' })).toBeInTheDocument();
  });

  it('should call onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<UserCard name="Ada" onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'Select' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
```

- Interactions go through `userEvent.setup()` and `await user.click(...)`, not
  `fireEvent`.
- Handlers are `vi.fn()` asserted by call count, including the negative case —
  a disabled control asserts `toHaveBeenCalledTimes(0)`.
- Query by `getByRole` / `getByText`. Reach for `getByTestId` only when no
  accessible query exists, such as a decorative spinner.
- Assert on what the user observes, not on state or implementation details.

## Naming

Test names read `should <behaviour> correctly` or `should <effect> when
<action>`. Group a unit's tests in one `describe` named for the unit.
