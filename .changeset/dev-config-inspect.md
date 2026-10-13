---
'@chanom/dev-config': minor
---

Make the shipped configs inspectable: add a `chanom-dev-config print <name>` bin that prints any config as JSON, keep literal values (e.g. `tabWidth: 2`, exact glob lists) in the published types so editors show them on hover, and emit `dist/` file for file instead of hashed chunks. Exported configs are now typed as readonly.
