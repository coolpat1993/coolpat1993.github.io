// Runs the engine tests under Node: `node tests/run.js`
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = global;
const root = path.join(__dirname, '..');
['config', 'rng', 'cards', 'enemies', 'relics', 'state', 'combat', 'map', 'rewards', 'shop', 'events', 'flow', 'save']
  .map(f => path.join(root, 'js', f + '.js'))
  .concat([path.join(__dirname, 'bot.js'), path.join(__dirname, 'engine-tests.js')])
  .forEach(f => vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f }));

const ok = global.SC.runTests(console.log);
process.exit(ok ? 0 : 1);
