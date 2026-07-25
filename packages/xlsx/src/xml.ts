import { XMLParser } from 'fast-xml-parser';

const ALWAYS_ARRAY = new Set([
  'Relationship',
  'Override',
  'Default',
  'sheet',
  'row',
  'c',
  'si',
  'r',
]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: false,
  trimValues: false,
  isArray: (name) => ALWAYS_ARRAY.has(name),
});

export function parseXml(xml: string): Record<string, unknown> {
  return parser.parse(xml) as Record<string, unknown>;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encodeUtf8(str: string): Uint8Array {
  return encoder.encode(str);
}

export function decodeUtf8(bytes: Uint8Array): string {
  return decoder.decode(bytes);
}

export function attr(node: Record<string, unknown>, name: string): string | undefined {
  const v = node[`@_${name}`];
  return typeof v === 'string' ? v : undefined;
}

export function child<T = Record<string, unknown>>(
  node: Record<string, unknown>,
  name: string,
): T | undefined {
  return node[name] as T | undefined;
}

export function children<T = Record<string, unknown>>(
  node: Record<string, unknown>,
  name: string,
): T[] {
  const v = node[name];
  if (!v) return [];
  if (Array.isArray(v)) return v as T[];
  return [v as T];
}

export function textContent(node: unknown): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (node && typeof node === 'object') {
    const n = node as Record<string, unknown>;
    if ('#text' in n) return String(n['#text']);
  }
  return '';
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
