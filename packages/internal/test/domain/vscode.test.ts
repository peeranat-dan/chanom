import { describe, expect, it } from 'vitest';

import {
  chanomSettings,
  planExtensions,
  planSettings,
  RECOMMENDED_EXTENSIONS,
} from '../../src/domain/vscode.ts';

describe('chanomSettings', () => {
  it('routes formatting through the oxc code action rather than formatOnSave', () => {
    const settings = chanomSettings('oxfmt.config.ts');
    expect(settings['editor.defaultFormatter']).toBe('oxc.oxc-vscode');
    expect(settings['editor.formatOnSave']).toBe(false);
    expect(settings['editor.codeActionsOnSave']).toEqual({
      'source.format.oxc': 'always',
      'source.fixAll.oxc': 'always',
      'source.removeUnusedImports': 'always',
    });
    expect(settings['oxc.typeAware']).toBe(true);
  });

  it('points the oxc extension at the given oxfmt config path', () => {
    expect(chanomSettings('oxfmt.config.mts')['oxc.fmt.configPath']).toBe('oxfmt.config.mts');
  });

  it('sets the oxc formatter for every language chanom formats', () => {
    const settings = chanomSettings('oxfmt.config.ts');
    for (const language of ['markdown', 'json', 'typescriptreact', 'typescript', 'javascript']) {
      expect(settings[`[${language}]`]).toEqual({ 'editor.defaultFormatter': 'oxc.oxc-vscode' });
    }
  });

  it('omits repo-specific settings so the config is portable', () => {
    const settings = chanomSettings('oxfmt.config.ts');
    expect(settings['cSpell.words']).toBeUndefined();
    expect(settings['git.addAICoAuthor']).toBeUndefined();
  });
});

describe('planSettings', () => {
  it('adds every key when there are no existing settings', () => {
    const plan = planSettings(undefined, { a: 1, b: 2 });
    expect(plan.settings).toEqual({ a: 1, b: 2 });
    expect(plan.added).toEqual(['a', 'b']);
    expect(plan.skipped).toEqual([]);
  });

  it('keeps existing values and reports them as skipped', () => {
    const plan = planSettings({ a: 'mine' }, { a: 'ours', b: 'ours' });
    expect(plan.settings).toEqual({ a: 'mine', b: 'ours' });
    expect(plan.added).toEqual(['b']);
    expect(plan.skipped).toEqual(['a']);
  });

  it('treats an explicitly falsy existing value as set, not missing', () => {
    const plan = planSettings({ 'editor.formatOnSave': false }, { 'editor.formatOnSave': true });
    expect(plan.settings['editor.formatOnSave']).toBe(false);
    expect(plan.skipped).toEqual(['editor.formatOnSave']);
  });

  it('leaves unrelated existing settings untouched', () => {
    const plan = planSettings({ 'files.eol': '\n' }, chanomSettings('oxfmt.config.ts'));
    expect(plan.settings['files.eol']).toBe('\n');
  });
});

describe('planExtensions', () => {
  it('recommends the oxc extension', () => {
    expect(RECOMMENDED_EXTENSIONS).toEqual(['oxc.oxc-vscode']);
  });

  it('appends to existing recommendations, preserving their order', () => {
    const plan = planExtensions(['vercel.turbo-vsc'], ['oxc.oxc-vscode']);
    expect(plan.recommendations).toEqual(['vercel.turbo-vsc', 'oxc.oxc-vscode']);
    expect(plan.added).toEqual(['oxc.oxc-vscode']);
  });

  it('adds nothing when the extension is already recommended', () => {
    const plan = planExtensions(['oxc.oxc-vscode'], ['oxc.oxc-vscode']);
    expect(plan.recommendations).toEqual(['oxc.oxc-vscode']);
    expect(plan.added).toEqual([]);
  });
});
