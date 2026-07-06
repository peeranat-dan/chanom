import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';

interface Release {
  name: string;
  type: string;
  newVersion: string;
}

const OUTPUT_FILE = 'changeset-status.json';
const FALLBACK_MESSAGE = 'chore: version packages';

function getCommitMessage() {
  try {
    execFileSync('pnpm', ['changeset', 'status', `--output=${OUTPUT_FILE}`], {
      stdio: ['ignore', 'ignore', 'inherit'],
    });
    const { releases } = JSON.parse(readFileSync(OUTPUT_FILE, 'utf8')) as { releases: Release[] };
    const versions = releases
      .filter((release) => release.type !== 'none')
      .map((release) => `${release.name}@${release.newVersion}`)
      .join(', ');
    return versions ? `${FALLBACK_MESSAGE} (${versions})` : FALLBACK_MESSAGE;
  } catch {
    return FALLBACK_MESSAGE;
  } finally {
    rmSync(OUTPUT_FILE, { force: true });
  }
}

// oxlint-disable-next-line no-console
console.log(getCommitMessage());
