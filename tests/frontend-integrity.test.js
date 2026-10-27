const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { extname } = require('node:path');

const files = execFileSync('git', ['ls-files', '-z', 'frontend'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter(file => ['.html', '.css', '.js', '.json', '.md'].includes(extname(file)));

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  if (/^(<<<<<<< .+|=======|>>>>>>> .+)$/m.test(source)) {
    throw new Error(`Unresolved merge conflict in ${file}`);
  }
  if (extname(file) === '.js') {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  }
}

console.log(`Frontend integrity passed (${files.length} source files).`);
