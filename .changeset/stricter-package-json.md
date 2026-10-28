---
'@chanom/cli': patch
'create-chanom-app': patch
---

Validate `package.json` with Effect `Schema`. A `package.json` whose known fields have the wrong shape (for example `"type": "esm"` or `"scripts": []`) now fails with an error naming the field, instead of passing through. Key order and fields chanom does not read are preserved when it writes the file back.
