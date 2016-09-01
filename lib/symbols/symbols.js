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

  function updateCoverageStatusFromTestResults(testResults) {
    console.log(testResults);
    memberExpressions.forEach(exp => {
      console.log(exp.coveringTestName);
      exp.coverageStatus = testResults[exp.coveringTestName] || '';
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

module.exports = Symbols;
