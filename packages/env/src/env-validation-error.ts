import type { EnvIssue } from './types.ts';

const formatIssues = (issues: readonly EnvIssue[]): string =>
  issues.map((issue) => `  - ${issue.key}: ${issue.message}`).join('\n');

/** Thrown when one or more environment variables fail their schema. */
export class EnvValidationError extends Error {
  override readonly name = 'EnvValidationError';
  readonly issues: readonly EnvIssue[];

  constructor(issues: readonly EnvIssue[]) {
    super(`Invalid environment variables:\n${formatIssues(issues)}`);
    this.issues = issues;
  }
}
