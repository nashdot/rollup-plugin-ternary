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

test('basic 2-level nested', t => {
  return rollupTernary('test_01.js').then(b => {
    t.is(b.generate().code, expected('test_01.js'));
  });
});

test('skip 1-level', t => {
  return rollupTernary('test_02.js').then(b => {
    t.is(b.generate().code, expected('test_02.js'));
  });
});

test('transform 1-level if extra=false', t => {
  return rollupTernary('test_03.js', { extra: false }).then(b => {
    t.is(b.generate().code, expected('test_03.js'));
  });
});

test('transform 2-level with special chars', t => {
  return rollupTernary('test_04.js').then(b => {
    t.is(b.generate().code, expected('test_04.js'));
  });
});
