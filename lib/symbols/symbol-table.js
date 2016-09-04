const fs = require('fs');

function SymbolTable() {
  const importDeclarations = [];
  let memberExpressions = [];

  function print() {
    // const symbols = [...importDeclarations, ...memberExpressions];
    const symbols = memberExpressions;
    // symbols.forEach(s => console.log(s));
    fs.writeFile('1984-coverage.json', JSON.stringify(symbols, null, 4), (err) => {
      if (err) throw err;
      console.log('coverage file updated.');
      console.log('watching...');
    });
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

  function updateCoverageStatusFromTestResults(testResults) {
    memberExpressions.forEach(exp => {
      exp.coverageStatus = testResults[exp.coveringTest.name] || '';
    });
  }

  function addMemberExpression(memExpSymbol) {
    memberExpressions.push(memExpSymbol);
  }

  return {
    importDeclarations,
    addMemberExpression,
    updateCoverageStatusFromTestResults,
    print,
    update,
  };
}

module.exports = SymbolTable;
