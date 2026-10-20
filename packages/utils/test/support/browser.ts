import { vi } from 'vitest';

export interface FakeTextarea {
  value: string;
  readonly style: Record<string, string>;
  readonly setAttribute: (name: string, value: string) => void;
  readonly select: () => void;
}

export interface FakeDocument {
  readonly appended: FakeTextarea[];
  readonly removed: FakeTextarea[];
  readonly execCommand: ReturnType<typeof vi.fn<(command: string) => boolean>>;
}

/**
 * Stub `document` with just enough surface for the execCommand copy fallback.
 * Undone automatically after each test via `unstubGlobals` in vitest.config.ts.
 */
export const stubDocument = (): FakeDocument => {
  const appended: FakeTextarea[] = [];
  const removed: FakeTextarea[] = [];
  const execCommand = vi.fn<(command: string) => boolean>().mockReturnValue(true);
  vi.stubGlobal('document', {
    createElement: (): FakeTextarea => ({
      value: '',
      style: {},
      setAttribute: () => {},
      select: () => {},
    }),
    body: {
      appendChild: (element: FakeTextarea) => appended.push(element),
      removeChild: (element: FakeTextarea) => removed.push(element),
    },
    execCommand,
  });
  return { appended, removed, execCommand };
};

/** Stub `navigator.clipboard.writeText`, or remove the Clipboard API entirely. */
export const stubClipboard = (
  writeText?: (text: string) => Promise<void>,
): ReturnType<typeof vi.fn<(text: string) => Promise<void>>> | undefined => {
  if (writeText === undefined) {
    vi.stubGlobal('navigator', {});
    return undefined;
  }
  const spy = vi.fn(writeText);
  vi.stubGlobal('navigator', { clipboard: { writeText: spy } });
  return spy;
};
