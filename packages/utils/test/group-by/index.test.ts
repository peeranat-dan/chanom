import { describe, expect, it } from 'vitest';

import groupBy from '../../src/group-by/index.ts';

describe('groupBy', () => {
  it('groups items by key in their original order', () => {
    const users = [
      { name: 'a', role: 'admin' },
      { name: 'b', role: 'member' },
      { name: 'c', role: 'admin' },
    ] as const;

    expect(groupBy(users, (user) => user.role)).toEqual({
      admin: [users[0], users[2]],
      member: [users[1]],
    });
  });

  it('passes the index to getKey', () => {
    expect(groupBy(['a', 'b', 'c'], (_, index) => (index % 2 === 0 ? 'even' : 'odd'))).toEqual({
      even: ['a', 'c'],
      odd: ['b'],
    });
  });

  it('returns an empty object for no items', () => {
    expect(groupBy([], () => 'key')).toEqual({});
  });
});
