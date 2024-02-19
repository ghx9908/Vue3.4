// packages/compiler-core/src/parser.ts
function createParserContext(content) {
  return {
    line: 1,
    column: 1,
    offset: 0,
    source: content,
    originalSource: content
  };
}
function isEnd(context) {
  const source = context.source;
  return !source;
}
function advancePositionWithMutation(context, s, endIndex) {
  let linesCount = 0;
  let linePos = -1;
  for (let i = 0; i < endIndex; i++) {
    if (s.charCodeAt(i) === 10) {
      linesCount++;
      linePos = i;
    }
  }
  context.offset += endIndex;
  context.line += linesCount;
  context.column = linePos == -1 ? context.column + endIndex : endIndex - linePos;
}
function advanceBy(context, endIndex) {
  let s = context.source;
  advancePositionWithMutation(context, s, endIndex);
  context.source = s.slice(endIndex);
}
function parseTextData(context, endIndex) {
  const rawText = context.source.slice(0, endIndex);
  advanceBy(context, endIndex);
  return rawText;
}
function getCursor(context) {
  let { line, column, offset } = context;
  return { line, column, offset };
}
function getSelection(context, start) {
  const end = getCursor(context);
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset)
  };
}
function parseText(context) {
  const endTokens = ["<", "{{"];
  let endIndex = context.source.length;
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }
  let start = getCursor(context);
  const content = parseTextData(context, endIndex);
  return {
    type: 2 /* TEXT */,
    content,
    loc: getSelection(context, start)
  };
}
function parseChildren(context) {
  const nodes = [];
  while (!isEnd(context)) {
    const s = context.source;
    let node;
    if (s.startsWith("{{")) {
      node = {};
    } else if (s[0] === "<") {
      if (/[a-z]/i.test(s[1])) {
        node = {};
      }
    }
    if (!node) {
      node = parseText(context);
    }
    nodes.push(node);
    break;
  }
  return nodes;
}
function baseParse(template) {
  const context = createParserContext(template);
  return parseChildren(context);
}

// packages/compiler-core/src/index.ts
function compile(template) {
  return baseParse(template);
}
export {
  compile
};
//# sourceMappingURL=compiler-core.esm.js.map
