# @chanom/logger

## 0.1.0

### Minor Changes

- 57219d5: Initial release: a tiny, zero-dependency, provider-agnostic logger for web apps. Records fan out to providers (built-in console provider by default, or your own), gated by an `enabled` switch you wire to your environment (e.g. `import.meta.env.DEV`) and by log-level filtering (`debug`/`info`/`warn`/`error`, changeable at runtime). Includes namespaced child loggers and `isEnabled` checks to skip expensive log-only work.
