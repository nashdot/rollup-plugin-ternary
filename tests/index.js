import test from 'ava';
import fs       from 'fs';
import { join } from 'path';
import { rollup } from 'rollup';
import ternary from '..';

const fixturesDir = join(__dirname, 'fixtures');
const expectDir   = join(__dirname, 'expect');
const expected    = name => fs.readFileSync(join(expectDir, name), 'utf8');

function rollupTernary(filename, options = {}) {
  return rollup({
    entry: join(fixturesDir, filename),
    plugins: [ternary(options)]
  });
}

test('test_01', t => {
  return rollupTernary('test_01.js').then(b => {
    t.is(b.generate().code, expected('test_01.js'));
  });
});
