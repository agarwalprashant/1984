import test from 'ava';
import calc from '../simplecalc';

test('add', t => {
  t.is(calc.add(2, 2), 4);
});

test('subtract', t => {
  t.is(calc.subtract(10, 8), 2);
});

test('divide', t => {
  t.is(calc.divide(10, 2), 5);
});

test('multiply', t => {
  t.is(calc.multiply(4, 2), 8);
});

test('modulo', t => {
  t.is(calc.modulo(10, 2), 0);
});
