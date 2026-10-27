const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { extname } = require('node:path');
const vm = require('node:vm');

const files = execFileSync('git', ['ls-files', '-z', 'game'], { encoding: 'utf8' })
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

const game = readFileSync('game/js/game.js', 'utf8');
const clips = readFileSync('game/js/catch-clips.js', 'utf8');
const tips = readFileSync('game/js/tips.js', 'utf8');
const moodsMatch = game.match(/const VARS = (\{[\s\S]*?\n  \});/);
const storyMatch = clips.match(/const storyboard = (\{[\s\S]*?\n  \});/);
if (!moodsMatch || !storyMatch) throw new Error('Catch guide roster or storyboard is missing');
const moods = vm.runInNewContext(`(${moodsMatch[1]})`);
const storyboards = vm.runInNewContext(`(${storyMatch[1]})`);
for (const type of Object.keys(moods)) {
  if (!storyboards[type] || storyboards[type].length !== 3) throw new Error(`${type} guide must have three pictures`);
}
if (!storyboards.C1 || storyboards.C1.length !== 3) throw new Error('Breathing Calm guide must have three pictures');
for (const type of [...Object.keys(moods), 'C1']) {
  const guides = [...tips.matchAll(/catchClipSteps: \{([\s\S]*?)\n        \},/g)].map(match => match[1]);
  if (guides.length < 2 || guides.some(guide => !new RegExp(`^\\s*${type}:`, 'm').test(guide))) {
    throw new Error(`English and Burmese catch captions are required for ${type}`);
  }
}
if (/setInterval\s*\(/.test(clips)) throw new Error('Catch guides must not use a timed auto-advance');
if (!game.includes("c.vy = -Math.max(jumpSpeed * 1.32, 1050)")) throw new Error('Wall jump impulse is missing');
if (!game.includes("timer: .2")) throw new Error('Ledge grab auto-climb timing is missing');
if ([...tips.matchAll(/mechanics: \{[\s\S]*?wallJump:/g)].length !== 2
  || [...tips.matchAll(/mechanicTitles: \{[^\n]*wallJump:/g)].length !== 2) {
  throw new Error('English and Burmese wall-jump guidance and titles are required');
}

console.log(`Game source integrity passed (${files.length} files).`);
