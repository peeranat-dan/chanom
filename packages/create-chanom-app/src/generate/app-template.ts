/**
 * Replaces the placeholder app name in the generated component and its test.
 * The app name is normalized before it reaches this renderer.
 */
export function renderAppTemplate(template: string, appName: string): string {
  return template.replaceAll('my-app', appName);
}
