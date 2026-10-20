import { vi } from 'vitest';

/**
 * Stub `localStorage` or `sessionStorage` with an in-memory `Storage`. Undone
 * after each test via `unstubGlobals`.
 */
export const stubStorage = (name: 'localStorage' | 'sessionStorage'): Storage => {
  const items = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return items.size;
    },
    clear: () => {
      items.clear();
    },
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => {
      items.delete(key);
    },
    setItem: (key, value) => {
      items.set(key, String(value));
    },
  };
  vi.stubGlobal(name, storage);
  return storage;
};
