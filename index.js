const fs = require('fs');
const esprima = require('esprima-harmony');
const walk = require('esprima-walk');
const events = require('events');
const exec = require('child_process').exec;

function getAstForFile(filename) {
  const srcCode = fs.readFileSync(filename);
  return esprima.parse(srcCode, {
    loc: true,
  });
}

function CallSymbol(node) {
  return {
    type: node.type,
    object: node.callee.object.name || '',
    property: node.callee.property.name || '',
    start: node.loc.start.line,
    end: node.loc.end.line,
    source: '',
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
  let callExpressions = [];

  function print() {
    [...importDeclarations, ...callExpressions].forEach(s => console.log(s));
  }

  function update() {
    const imports = importDeclarations
    .map(d => d.specifiers.map(s => ({ name: s, source: d.source })))
    .reduce((prev, curr) => prev.concat(curr));

    callExpressions.forEach((call, index) => {
      const matchingImport = imports.filter(i => i.name === call.object)[0];
      if (matchingImport) callExpressions[index].source = matchingImport.source;
    });

    callExpressions = callExpressions.filter(c => c.source !== '');
  }

  return {
    callExpressions,
    importDeclarations,
    print,
    update,
  };
}

function walkAst(ast) {
  walk(ast, (node) => {
    if (node.type === 'ImportDeclaration') {
      const symb = new ImportSymbol(node);
      symbols.importDeclarations.push(symb);
    }
    if (node.type === 'CallExpression' && node.callee.object && node.callee.property) {
      const symb = new CallSymbol(node);
      symbols.callExpressions.push(symb);
    }
    // if (node.type === 'ExpressionStatement') {
    //   console.log(node.expression);
    // }
    // if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
    //   const symb = new Symbol(node);
    //   console.log(symb);
    // }
  });
}

function analyseTestResults(testOutput, executionError) {
  console.log('hi, i do stuff post test');
  console.log(executionError);
  console.log(testOutput);
}

const TESTS_FINISHED_EVENT = 'TESTS_FINISHED_EVENT';

const symbols = new Symbols();
const filename = process.argv[2];
const eventEmitter = new events.EventEmitter();

eventEmitter.on(TESTS_FINISHED_EVENT, analyseTestResults);

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

  ast = getAstForFile(filename);
  walkAst(ast);
  symbols.update();
  symbols.print();

  exec('ava', (error, testOutput, executionError) => {
    eventEmitter.emit(TESTS_FINISHED_EVENT, testOutput, executionError);
  });
});
