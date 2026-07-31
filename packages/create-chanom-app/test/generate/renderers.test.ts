import { describe, expect, it } from 'vitest';

import { emptyContribution } from '../../src/domain/contribution.ts';
import { renderIndexHtml } from '../../src/generate/index-html.ts';
import { buildTsconfig } from '../../src/generate/tsconfig.ts';
import { renderViteConfig } from '../../src/generate/vite-config.ts';

describe('renderViteConfig', () => {
  it('renders the baseline config from the folded imports and plugins', () => {
    const contribution = {
      ...emptyContribution,
      viteImports: ["import react from '@vitejs/plugin-react';"],
      vitePlugins: ['react()'],
    };
    expect(renderViteConfig(contribution)).toBe(
      `import { createViteConfig } from '@chanom/vite-config';
import react from '@vitejs/plugin-react';

export default createViteConfig({ plugins: [react()] });
`,
    );
  });
});

describe('buildTsconfig', () => {
  it('extends the vite-react base and includes src', () => {
    const tsconfig = JSON.parse(buildTsconfig());
    expect(tsconfig.extends).toBe('@tsconfig/vite-react/tsconfig.json');
    expect(tsconfig.include).toEqual(['src']);
    expect(tsconfig.compilerOptions.types).toEqual(['vite/client', 'vitest/globals']);
  });
});

describe('renderIndexHtml', () => {
  it('puts the app name in the title', () => {
    expect(renderIndexHtml('my-app')).toContain('<title>my-app</title>');
  });
});
