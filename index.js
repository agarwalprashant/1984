const fs = require('fs');
const esprima = require('esprima-harmony');
const walk = require('esprima-walk');

const filename = process.argv[2];
const srcCode = fs.readFileSync(filename);

const ast = esprima.parse(srcCode, {
  loc: true,
});

// console.log(ast);


// function Symbol(node) {
//   return {
//     name: node.id.name || '',
//     type: node.type,
//     object: node.object.name,
//     property: node.property.name,
//     start: node.loc.start.line,
//     end: node.loc.end.line,
//   };
// }

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

const symbols = new Symbols();

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

symbols.update();
symbols.print();
