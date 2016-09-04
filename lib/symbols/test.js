function Test(node) {
  return {
    name: node.expression.arguments[0].value,
    start: node.loc.start.line,
    end: node.loc.end.line,
  };
}

module.exports = Test;
