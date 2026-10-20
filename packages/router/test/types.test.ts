import { describe, expectTypeOf, it } from 'vitest';

import type { HrefArgs, Params, Path } from '../src/types.ts';
import type {} from './support/register.ts';

describe('Path', () => {
  it('is the registered union', () => {
    expectTypeOf<Path>().toEqualTypeOf<
      '/' | '/about' | '/search' | '/login' | '/posts/:id' | '/:lang?/docs' | '/files/*'
    >();
  });
});

describe('Params', () => {
  it('is empty for static paths', () => {
    expectTypeOf<Params<'/about'>>().toEqualTypeOf<{}>();
  });

  it('types required, optional, and splat params', () => {
    expectTypeOf<Params<'/:lang?/posts/:id/*'>>().toEqualTypeOf<{
      readonly id: string;
      readonly lang?: string;
      readonly '*': string;
    }>();
  });

  it('falls back to a string record for unregistered paths', () => {
    expectTypeOf<Params<string>>().toEqualTypeOf<Readonly<Record<string, string | undefined>>>();
  });
});

describe('HrefArgs', () => {
  it('requires options only when a param is required', () => {
    expectTypeOf<[{ params: { id: '1' } }]>().toExtend<HrefArgs<'/posts/:id'>>();
    expectTypeOf<[]>().toExtend<HrefArgs<'/:lang?/docs'>>();
    expectTypeOf<[]>().not.toExtend<HrefArgs<'/posts/:id'>>();
  });
});
