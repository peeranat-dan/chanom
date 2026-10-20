/**
 * Structural equality for plain data: primitives (`NaN` equals `NaN`), arrays,
 * plain objects (own enumerable string keys), `Date`, `RegExp`, `Map`, and
 * `Set`. Instances of other classes (`URL`, `Error`, typed arrays, ...) compare
 * by reference, since their own keys do not reflect their state. Handles cycles.
 */
export default function isDeepEqual(a: unknown, b: unknown): boolean {
  return equal(a, b, new Map());
}

function equal(a: unknown, b: unknown, seen: Map<object, Set<object>>): boolean {
  if (a === b || (Number.isNaN(a) && Number.isNaN(b))) {
    return true;
  }
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
    return false;
  }
  // A pair still being compared higher up the stack is assumed equal, which is
  // what stops cycles from recursing forever. It is removed once settled so a
  // failed pair is not mistaken for an equal one later.
  const partners = seen.get(a) ?? new Set<object>();
  if (partners.has(b)) {
    return true;
  }
  seen.set(a, partners.add(b));
  const result = equalObjects(a, b, seen);
  partners.delete(b);
  return result;
}

function equalObjects(a: object, b: object, seen: Map<object, Set<object>>): boolean {
  if (a instanceof Date && b instanceof Date) {
    return Object.is(a.getTime(), b.getTime());
  }
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags;
  }
  if (a instanceof Map && b instanceof Map) {
    return equalMaps(a, b, seen);
  }
  if (a instanceof Set && b instanceof Set) {
    return equalSets(a, b, seen);
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((value, index) => equal(value, b[index], seen));
  }
  if (!isPlainObject(a)) {
    return false;
  }
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every(
      (key) => Object.hasOwn(b, key) && equal(Reflect.get(a, key), Reflect.get(b, key), seen),
    )
  );
}

function equalMaps(
  a: ReadonlyMap<unknown, unknown>,
  b: ReadonlyMap<unknown, unknown>,
  seen: Map<object, Set<object>>,
): boolean {
  return (
    a.size === b.size &&
    [...a].every(([key, value]) => b.has(key) && equal(value, b.get(key), seen))
  );
}

function equalSets(
  a: ReadonlySet<unknown>,
  b: ReadonlySet<unknown>,
  seen: Map<object, Set<object>>,
): boolean {
  const others = [...b];
  return (
    a.size === b.size &&
    [...a].every((value) => b.has(value) || others.some((other) => equal(value, other, seen)))
  );
}

function isPlainObject(value: object): boolean {
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
