---
'@chanom/cli': patch
'create-chanom-app': patch
---

Fix spinner flickering during dependency installation by capturing package manager output instead of streaming it. Output is shown when the install fails.
