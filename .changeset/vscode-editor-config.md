---
'create-chanom-app': minor
'@chanom/cli': minor
---

Add VS Code editor config to generated and brewed projects.

`create-chanom-app` now writes `.vscode/settings.json` and
`.vscode/extensions.json` into every scaffolded app, and `chanom brew` gains a
`vscode` topping that does the same for an existing project. The settings route
formatting and lint fixes through the oxc extension on save and recommend it, so
a fresh clone is set up without any manual editor configuration.

In `brew`, both files are merged rather than overwritten: settings you already
have win (and are reported), existing extension recommendations are kept, and a
`.vscode` file that isn't parseable JSON is left untouched with a warning.
