import type { ToStringOptions } from 'yaml';

import { isMap, isNode, isScalar, isSeq } from 'yaml';

/** Stringify options shared by every YAML file chanom generates, so they all read alike. */
export const YAML_OPTIONS: ToStringOptions = {
  singleQuote: true,
  // Never fold long `run:` commands across lines.
  lineWidth: 0,
  flowCollectionPadding: false,
};

/**
 * Puts a blank line before every entry of a map or sequence node except the
 * first. Mutates the node, so only call it on a `Document` built for output.
 */
export function spaceItems(node: unknown): void {
  if (isMap(node)) {
    for (const pair of node.items.slice(1)) {
      if (isScalar(pair.key)) pair.key.spaceBefore = true;
    }
  } else if (isSeq(node)) {
    for (const item of node.items.slice(1)) {
      if (isNode(item)) item.spaceBefore = true;
    }
  }
}
