// packages/compiler-core/src/index.ts
function createParseContext(context) {
  return {
    line: 1,
    coumn: 1,
    source: context,
    originalSource: context
  };
}
function isEnd(context) {
  const source = context.source;
  return !source;
}
function parseChildren(context) {
  const nodes = [];
  while (!isEnd) {
    let node;
    const s = context.source;
    if (s.startsWith("{{")) {
    }
    if (s.startsWith("<")) {
    }
    if (!node) {
    }
  }
  return nodes;
}
function parse(template) {
  const context = createParseContext(template);
  return parseChildren(context);
}
function compile(template) {
  const ast = parse(template);
  return ast;
}
export {
  compile,
  parse
};
//# sourceMappingURL=compiler-core.js.map
