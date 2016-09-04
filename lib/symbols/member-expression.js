function MemberExpSymbol(node, coveringTest) {
  return {
    type: node.type,
    object: node.object.name || '',
    property: node.property.name || '',
    start: node.loc.start.line,
    end: node.loc.end.line,
    source: '',
    coveringTest,
    coverageStatus: '',
  };
}

module.exports = MemberExpSymbol;
