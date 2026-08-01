---
'create-chanom-app': patch
---

Render template files through a single `{{appName}}` token replacer instead of per-file string replacement. Substitution sites are now explicit, so an incidental occurrence of the app name in a template is never clobbered, and adding a templated file no longer requires dispatch wiring in the scaffolder. Template copies also run concurrently.
