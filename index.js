const fs = require('fs');
const esprima = require('esprima-harmony');
const esquery = require('esquery');
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
  let callExpressions = [];
  let memberExpressions = [];

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

  function addMemberExpression(memExpSymbol) {
  }

  return {
    callExpressions,
    importDeclarations,
    addMemberExpression,
    print,
    update,
  };
}

function walkAst(ast) {
  walk(ast, (node) => {
    // if (node.type === 'ImportDeclaration') {
    //   const symb = new ImportSymbol(node);
    //   symbols.importDeclarations.push(symb);
    // }
    // if (node.type === 'CallExpression' && node.callee.object && node.callee.property) {
    //   const symb = new CallSymbol(node);
    //   symbols.callExpressions.push(symb);
    // }
    if (node.type === 'ExpressionStatement' && node.expression.callee.name === 'test') {
      // console.log(`${node.expression.callee.name} ${node.}`);
      // updateCallExpressionSymbols(node);
      // console.log(node);
      const testName = node.expression.arguments[0].value;
      const matches = esquery(node, 'CallExpression > MemberExpression');
      console.log(`
        -------------------
        m a t c h e s 
        -------------------`);
      // console.log(matches);
      const memExpSymbols = matches.map(astNode => new MemberExpSymbol(astNode, testName));
      console.log(memExpSymbols);
      memExpSymbols.forEach(symbol => symbols.addMemberExpression(symbol));
    }
    // if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') {
    //   // const symb = new Symbol(node);
    //   // console.log(symb);
    //   console.log(node);
    // }
  });
}

function updateCallExpressionSymbols(ast) {
  walk(ast, (node) => {
    if (node.type === 'CallExpression' && node.callee.object && node.callee.property) {
      const symb = new CallSymbol(node);
      console.log(symb);
    }
  });
}

function analyseTestResults(testOutput) {
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

const TESTS_FINISHED_EVENT = 'TESTS_FINISHED_EVENT';

let symbols = new Symbols();
const filename = process.argv[2];
const eventEmitter = new events.EventEmitter();

eventEmitter.on(TESTS_FINISHED_EVENT, analyseTestResults);

let ast = getAstForFile(filename);
// console.log(ast);
walkAst(ast);

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


// get symbols from source file
// get symbols from test file
// find symbols used in each test
