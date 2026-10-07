import { execFileSync } from 'node:child_process';
if (execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()) {
  throw new Error('release:check requires clean working tree');
}
execFileSync('git', ['diff', '--check'], { stdio: 'inherit' });
execFileSync(process.execPath, ['--test', 'tests/opportunity-projection.test.mjs'], { stdio: 'inherit' });
console.log('release:check: PASS');
