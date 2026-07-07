# @chanom/cli

## 0.1.1

### Patch Changes

- 7b2c73d: add node_modules to .gitignore automatically during brew, appending it if the file already exists

## 0.1.0

### Minor Changes

- 097de84: add debug flag to chanom cli

### Patch Changes

- 097de84: show invalid package error in cli when processing malformed package.json

## 0.0.4

### Patch Changes

- 565d891: `chanom brew` now reinstalls `oxlint`, `oxfmt`, and `@chanom/dev-config` whenever the installed version doesn't match the CLI's pinned version, instead of skipping installation entirely once the package was present at any version.

## 0.0.3

### Patch Changes

- improve cli implementation

## 0.0.2

### Patch Changes

- - remove eslint and prettier
  - add knip config

## 0.0.1

### Patch Changes

- add initial chanom cli
