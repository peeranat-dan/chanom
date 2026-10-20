import { describe, expect, it } from 'vitest';

import renderNothing from '../../../src/react-router/utils/render-nothing.ts';

describe('renderNothing', () => {
  it('renders null', () => {
    expect(renderNothing()).toBeNull();
  });
});
