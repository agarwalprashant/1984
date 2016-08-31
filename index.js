/*
*   1984 POC
*/

const fs = require('fs');
const esprima = require('esprima-harmony');
const esquery = require('esquery');
const walk = require('esprima-walk');
const events = require('events');
const exec = require('child_process').exec;
// const _ = require('underscore');

/*
*   Classes
*/
function MemberExpSymbol(node, coveringTestName) {
  return {
    type: node.type,
    object: node.object.name || '',
    property: node.property.name || '',
    start: node.loc.start.line,
    end: node.loc.end.line,
    source: '',
    coveredBy: coveringTestName,
  };
}

function ImportSymbol(node) {
  function specifiers() {
    return node.specifiers.map(s => s.id.name);
  }
  return {
    type: node.type,
    specifiers: specifiers(),
    source: node.source.value,
    start: node.loc.start.line,
    end: node.loc.end.line,
  };
}

function Symbols() {
  const importDeclarations = [];
  let memberExpressions = [];

  function print() {
    [...importDeclarations, ...memberExpressions].forEach(s => console.log(s));
  }

  function update() {
    const imports = importDeclarations
    .map(d => d.specifiers.map(s => ({ name: s, source: d.source })))
    .reduce((prev, curr) => prev.concat(curr));

    // assign source filename to each symbol by analysing import statements
    memberExpressions.forEach((memExp, index) => {
      const matchingImport = imports.filter(imp => imp.name === memExp.object);
      const importExistsWithName = matchingImport[0];
      if (importExistsWithName) {
        const importSource = matchingImport[0].source;
        memberExpressions[index].source = importSource;
      }
    });

    memberExpressions = memberExpressions.filter(m => m.source !== '');
  }

  function addMemberExpression(memExpSymbol) {
    memberExpressions.push(memExpSymbol);
  }

  return {
    importDeclarations,
    addMemberExpression,
    print,
    update,
  };
}

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
      console.log(`
        -------------------
        m a t c h e s 
        -------------------`);
      const memExpSymbols = matches.map(astNode => new MemberExpSymbol(astNode, testName));
      console.log(memExpSymbols);
      memExpSymbols.forEach(symbol => symbols.addMemberExpression(symbol));
    }
  });
}

function parseTapOutput(testOutput) {
  const regex = /(not ok|ok)(.*)/g;
  const testResults = testOutput.match(regex)
  .reduce((results, currentResult, index) => {
    const arrayParts = currentResult.split('-');
    const testName = arrayParts[1].trim();
    const testStatus = arrayParts[0].includes('not ok') ? 'fail' : 'pass';
    results[index] = { testName, testStatus };
    return results;
  }, {});

  console.log(testResults);
}

/*
*   Main
*/
const TESTS_FINISHED_EVENT = 'TESTS_FINISHED_EVENT';

let symbols = new Symbols();
const filename = process.argv[2];
const eventEmitter = new events.EventEmitter();

eventEmitter.on(TESTS_FINISHED_EVENT, parseTapOutput);

let ast = getAstForFile(filename);
walkAst(ast);
symbols.update();
symbols.print();

/*
*   Watch
*/
const watchOptions = { persistent: true, interval: 500 };

fs.watchFile(filename, watchOptions, (current, previous) => {
  console.log(`current: ${current.mtime}`);
  console.log(`previous: ${previous.mtime}`);

  symbols = new Symbols();
  ast = getAstForFile(filename);
  walkAst(ast);
  symbols.update();
  symbols.print();

  exec('ava', (error, testOutput, executionError) => {
    eventEmitter.emit(TESTS_FINISHED_EVENT, testOutput, executionError);
  });
});

// TODO:
// use parsed failing test output to query for matching symbols by test name
// get symbols for source file as well as test file
// generate json file showing passing / failing lines
