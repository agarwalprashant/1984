import test from 'ava';
import calc from '../simplecalc';

test('my passing test', t => {
  t.pass();
});

test('test add', t => {
  const sum = calc.add(2, 2);
  t.is(sum, 4);
});

test('test subtract', t => {
  const sum = calc.subtract(5, 3);
  t.is(sum, 1);
});

test('test out division', t => {
  const result = calc.divide(10, 2);
  t.is(result, 5);
});
