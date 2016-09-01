function MemberExpSymbol(node, coveringTestName) {
  return {
    type: node.type,
    object: node.object.name || '',
    property: node.property.name || '',
    start: node.loc.start.line,
    end: node.loc.end.line,
    source: '',
    coveringTestName,
    coverageStatus: '',
  };
}

module.exports = MemberExpSymbol;
