import test from 'ava';
import calc from '../simplecalc';

test('my passing test', t => {
  t.pass();
});

test('test add', t => {
  const sum = calc.add(2, 2);
  t.is(sum, 4);
});

