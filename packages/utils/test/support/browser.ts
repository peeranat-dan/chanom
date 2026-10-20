import { vi } from 'vitest';

export interface FakeTextarea {
  value: string;
  readonly style: Record<string, string>;
  readonly setAttribute: (name: string, value: string) => void;
  readonly focus: () => void;
  readonly select: () => void;
  readonly remove: () => void;
}

export interface FakeFocusable {
  readonly focus: ReturnType<typeof vi.fn<(options?: FocusOptions) => void>>;
}

export interface FakeSelection {
  rangeCount: number;
  readonly getRangeAt: (index: number) => string;
  readonly removeAllRanges: ReturnType<typeof vi.fn<() => void>>;
  readonly addRange: ReturnType<typeof vi.fn<(range: string) => void>>;
}

export interface FakeDocument {
  readonly appended: FakeTextarea[];
  readonly removed: FakeTextarea[];
  readonly createElement: ReturnType<typeof vi.fn<() => FakeTextarea>>;
  readonly execCommand: ReturnType<typeof vi.fn<(command: string) => boolean>>;
  readonly selection: FakeSelection;
  readonly setActiveElement: (element: FakeFocusable | null) => void;
}

export const fakeFocusable = (): FakeFocusable => ({
  focus: vi.fn<(options?: FocusOptions) => void>(),
});

/**
 * Stub `document` with just enough surface for the execCommand copy fallback:
 * a textarea factory, body, focus tracking, and a selection holding string
 * stand-ins for ranges. Undone after each test via `unstubGlobals`.
 */
export const stubDocument = (): FakeDocument => {
  const appended: FakeTextarea[] = [];
  const removed: FakeTextarea[] = [];
  const ranges: string[] = [];
  const execCommand = vi.fn<(command: string) => boolean>().mockReturnValue(true);
  const fakeDocument: { activeElement: FakeFocusable | null } = { activeElement: null };

  const createElement = vi.fn((): FakeTextarea => {
    const textarea: FakeTextarea = {
      value: '',
      style: {},
      setAttribute: () => {},
      // Mirror the browser: focusing the textarea moves focus and drops the selection.
      focus: () => {
        fakeDocument.activeElement = null;
        ranges.length = 0;
        selection.rangeCount = 0;
      },
      select: () => {},
      remove: () => {
        removed.push(textarea);
      },
    };
    return textarea;
  });
  const selection: FakeSelection = {
    rangeCount: 0,
    getRangeAt: (index) => ranges[index] ?? '',
    removeAllRanges: vi.fn(() => {
      ranges.length = 0;
      selection.rangeCount = 0;
    }),
    addRange: vi.fn((range: string) => {
      ranges.push(range);
      selection.rangeCount = ranges.length;
    }),
  };

  vi.stubGlobal(
    'document',
    Object.assign(fakeDocument, {
      createElement,
      getSelection: () => selection,
      body: { appendChild: (element: FakeTextarea) => appended.push(element) },
      execCommand,
    }),
  );
  return {
    appended,
    removed,
    createElement,
    execCommand,
    selection,
    setActiveElement: (element) => {
      fakeDocument.activeElement = element;
    },
  };
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
