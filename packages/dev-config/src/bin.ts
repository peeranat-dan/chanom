#!/usr/bin/env node
import { configNames, formatConfig, loadConfig, parseArgs, usage } from './print.js';

const command = parseArgs(process.argv.slice(2));

switch (command.kind) {
  case 'print':
    process.stdout.write(`${formatConfig(await loadConfig(command.name))}\n`);
    break;
  case 'list':
    process.stdout.write(`${configNames.join('\n')}\n`);
    break;
  case 'usage':
    if (command.error !== undefined) {
      process.stderr.write(`${command.error}\n\n${usage()}\n`);
      process.exitCode = 1;
    } else {
      process.stdout.write(`${usage()}\n`);
    }
    break;
}
