/**
 * Replaces the template's project heading with the generated package name.
 * Keeping the rest of the template untouched makes README updates independent
 * from the scaffolding logic.
 */
export function renderReadme(template: string, appName: string): string {
  return template.replace(/^# my-app$/m, `# ${appName}`);
}
