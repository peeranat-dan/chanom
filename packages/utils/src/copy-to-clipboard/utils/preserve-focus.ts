/**
 * Snapshot the focused element and the document selection, and return a
 * function that puts both back, e.g. after a temporary element stole them.
 */
export default function preserveFocus(): () => void {
  // activeElement is typed as Element, but only HTML/SVG elements can take focus.
  const active = document.activeElement as (Element & Partial<HTMLOrSVGElement>) | null;
  const selection = document.getSelection();
  const ranges =
    selection === null
      ? []
      : Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index));

  return () => {
    active?.focus?.({ preventScroll: true });
    if (selection !== null && ranges.length > 0) {
      selection.removeAllRanges();
      for (const range of ranges) {
        selection.addRange(range);
      }
    }
  };
}
