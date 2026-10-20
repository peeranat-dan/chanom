import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import downloadFile from '../../src/download-file/index.ts';

interface FakeAnchor {
  href: string;
  download: string;
  readonly style: Record<string, string>;
  readonly click: ReturnType<typeof vi.fn<() => void>>;
  readonly remove: ReturnType<typeof vi.fn<() => void>>;
}

const stubAnchorDocument = (): { readonly anchor: FakeAnchor; readonly appended: FakeAnchor[] } => {
  const anchor: FakeAnchor = {
    href: '',
    download: '',
    style: {},
    click: vi.fn<() => void>(),
    remove: vi.fn<() => void>(),
  };
  const appended: FakeAnchor[] = [];
  vi.stubGlobal('document', {
    createElement: () => anchor,
    body: { appendChild: (element: FakeAnchor) => appended.push(element) },
  });
  return { anchor, appended };
};

describe('downloadFile', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('clicks a temporary download link for a Blob', () => {
    const { anchor, appended } = stubAnchorDocument();
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:file');
    const blob = new Blob(['a,b'], { type: 'text/csv' });

    expect(downloadFile(blob, 'report.csv')).toBe(true);
    expect(createObjectURL).toHaveBeenCalledExactlyOnceWith(blob);
    expect(appended).toEqual([anchor]);
    expect(anchor.href).toBe('blob:file');
    expect(anchor.download).toBe('report.csv');
    expect(anchor.click).toHaveBeenCalledOnce();
    expect(anchor.remove).toHaveBeenCalledOnce();
  });

  it('wraps a string in a Blob of the given type', async () => {
    stubAnchorDocument();
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:file');

    downloadFile('{"a":1}', 'data.json', { type: 'application/json' });

    const blob = createObjectURL.mock.calls[0]?.[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob instanceof Blob && blob.type).toBe('application/json');
    expect(blob instanceof Blob && (await blob.text())).toBe('{"a":1}');
  });

  it('revokes the object URL only after a delay', () => {
    stubAnchorDocument();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:file');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    downloadFile('text', 'note.txt');
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:file');
  });

  it('returns false outside the browser', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL');

    expect(downloadFile('text', 'note.txt')).toBe(false);
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
