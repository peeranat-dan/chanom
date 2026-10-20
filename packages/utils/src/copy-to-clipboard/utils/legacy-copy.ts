/**
 * Copy through a hidden textarea and `document.execCommand('copy')`, the only
 * option in non-secure contexts (plain http) and older browsers.
 */
export default function legacyCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    // oxlint-disable-next-line typescript/no-deprecated -- intentional fallback, see above
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
