/*
*   1984 POC
*/
const fs = require('fs');
const esprima = require('esprima-harmony');
const esquery = require('esquery');
const walk = require('esprima-walk');
const events = require('events');
const exec = require('child_process').exec;
const Symbols = require('./lib/symbols/symbols');
const MemberExpSymbol = require('./lib/symbols/member-expression');
const ImportSymbol = require('./lib/symbols/import');

/*
*   Functions
*/
function getAstForFile(filename) {
  const srcCode = fs.readFileSync(filename);
  return esprima.parse(srcCode, {
    loc: true,
  });
}

function walkAst(ast) {
  walk(ast, (node) => {
    if (node.type === 'ImportDeclaration') {
      const symb = new ImportSymbol(node);
      symbols.importDeclarations.push(symb);
    }
    if (node.type === 'ExpressionStatement' && node.expression.callee.name === 'test') {
      const testName = node.expression.arguments[0].value;
      const matches = esquery(node, 'CallExpression > MemberExpression');
      const memExpSymbols = matches.map(astNode => new MemberExpSymbol(astNode, testName));
      memExpSymbols.forEach(symbol => symbols.addMemberExpression(symbol));
    }
  });
}

function parseTapOutput(testOutput) {
  const regex = /(not ok|ok)(.*)/g;
  return testOutput.match(regex)
  .reduce((results, currentResult) => {
    const arrayParts = currentResult.split('-');
    const testName = arrayParts[1].trim();
    const testStatus = arrayParts[0].includes('not ok') ? 'fail' : 'pass';
    results[testName] = testStatus;
    return results;
  }, {});
}

function generateCoverageReport(testOutput) {
  const testResults = parseTapOutput(testOutput);
  symbols.updateCoverageStatusFromTestResults(testResults);
  symbols.print();
}

/*
*   Main
*/
const TESTS_FINISHED_EVENT = 'TESTS_FINISHED_EVENT';

const filename = process.argv[2];
const eventEmitter = new events.EventEmitter();
let ast = getAstForFile(filename);
let symbols = new Symbols();

eventEmitter.on(TESTS_FINISHED_EVENT, generateCoverageReport);

/*
*   Watch
*/
const watchOptions = { persistent: true, interval: 500 };

console.log('watching...');

fs.watchFile(filename, watchOptions, () => {
  symbols = new Symbols();
  ast = getAstForFile(filename);
  walkAst(ast);
  symbols.update();

  console.log('running tests...');
  exec('ava', (error, testOutput, executionError) => {
    eventEmitter.emit(TESTS_FINISHED_EVENT, testOutput, executionError);
  });
});
