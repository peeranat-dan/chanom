import type { EnvIssue } from './types.ts';

/** Where the issue happened, e.g. `VITE_CONFIG` or `VITE_CONFIG.db.port` for a nested value. */
const issueLocation = (issue: EnvIssue): string => {
  const path = issue.path ?? [];
  return [issue.key, ...path.map(String)].join('.');
};

const formatIssues = (issues: readonly EnvIssue[]): string =>
  issues.map((issue) => `  - ${issueLocation(issue)}: ${issue.message}`).join('\n');

/** Thrown when one or more environment variables fail their schema. */
export class EnvValidationError extends Error {
  override readonly name = 'EnvValidationError';
  readonly issues: readonly EnvIssue[];

  constructor(issues: readonly EnvIssue[]) {
    super(`Invalid environment variables:\n${formatIssues(issues)}`);
    this.issues = issues;
  }
}
