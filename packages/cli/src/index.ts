#!/usr/bin/env node
import { brew } from './commands/brew/index.ts';

const command = process.argv[2];

if (command === 'brew') {
  await brew();
} else {
  console.error(`Unknown command: ${command ?? '(none)'}`);
  console.error('Usage: chanom brew');
  process.exit(1);
}
