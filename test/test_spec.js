import test from 'ava';
import calc from '../simplecalc';

test('my pssing test', t => {
  t.pass();
});

test('test add', t => {
  const sum = calc.add(2, 2);
  t.is(sum, 4);
});

test('test subtract', t => {
  const sum = calc.subtract(5, 3);
  t.is(sum, 2);
});

test('test out division', t => {
  const result = calc.divide(10, 2);
  t.is(result, 5);
});

test('multiply', t => {
  const result = calc.multiply(10, 2);
  t.is(result, 20);
});
