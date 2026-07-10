import type { LogProvider, LogRecord } from '../../src/types.ts';

/** Provider that records every record it receives, for assertions. */
export const recordingProvider = (
  name = 'recording',
): { provider: LogProvider; records: LogRecord[] } => {
  const records: LogRecord[] = [];
  return {
    provider: {
      name,
      log: (record) => {
        records.push(record);
      },
    },
    records,
  };
};

/** Provider that throws on every record. */
export const throwingProvider = (name = 'boom'): LogProvider => ({
  name,
  log: () => {
    throw new Error(`${name} failed`);
  },
});
