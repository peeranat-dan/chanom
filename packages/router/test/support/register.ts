// Registers the paths the test suite navigates to, the way `router.gen.ts` does in an app.
declare module '../../src/types.ts' {
  interface Register {
    paths: '/' | '/about' | '/search' | '/login' | '/posts/:id' | '/:lang?/docs' | '/files/*';
  }
}

export {};
