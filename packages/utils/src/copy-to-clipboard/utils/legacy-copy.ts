import preserveFocus from './preserve-focus.ts';

/**
 * Copy through a hidden textarea and `document.execCommand('copy')`, the only
 * option in non-secure contexts (plain http) and older browsers. Never throws,
 * and gives focus and selection back to whatever held them before.
 */
export default function legacyCopy(text: string): boolean {
  let restoreFocus: (() => void) | undefined;
  let textarea: HTMLTextAreaElement | undefined;
  try {
    restoreFocus = preserveFocus();
    textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus({ preventScroll: true });
    textarea.select();
    // oxlint-disable-next-line typescript/no-deprecated -- intentional fallback, see above
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea?.remove();
    restoreFocus?.();
  }
}
