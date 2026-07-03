#!/usr/bin/env node
import { log } from '@clack/prompts';

import { brew } from './commands/brew/index.ts';

const command = process.argv[2];

if (command === 'brew') {
  await brew();
} else {
  log.error(`Unknown command: ${command ?? '(none)'}`);
  log.info('Usage: chanom brew');
  process.exit(1);
}
