/**
 * Renders `index.html` with the app name as its `<title>`. This is the one file
 * whose content varies by project name, so it is generated rather than copied;
 * the project name is validated to `[a-z0-9._-]`, so no HTML escaping is needed.
 */
export function renderIndexHtml(appName: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}
