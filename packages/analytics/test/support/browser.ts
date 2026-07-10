import { vi } from 'vitest';

export interface AppendedScript {
  readonly src: string;
  readonly async: boolean;
}

/**
 * Stub `window`/`document` with just enough surface for the providers:
 * a bare window object plus a document that records appended script tags.
 * Undone automatically after each test via `unstubGlobals` in vitest.config.ts.
 */
export const stubBrowser = (): {
  fakeWindow: Record<string, unknown>;
  appended: AppendedScript[];
} => {
  const appended: AppendedScript[] = [];
  const fakeWindow: Record<string, unknown> = {};
  vi.stubGlobal('window', fakeWindow);
  vi.stubGlobal('document', {
    createElement: () => ({ src: '', async: false }),
    head: {
      appendChild: (script: AppendedScript) => {
        appended.push(script);
      },
    },
  });
  return { fakeWindow, appended };
};
