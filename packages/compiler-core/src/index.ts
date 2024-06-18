


function createParseContext(context) {
  return {
    line: 1,
    coumn: 1,
    source: context,
    originalSource: context,

  }
}


function isEnd(context) {
  const source = context.source
  return !source
}
function parseChildren(context) {

  const nodes = []

  while (!isEnd) {
    let node;

    const s = context.source
    if (s.startsWith('{{')) {
      //处理表达式
    }
    if (s.startsWith("<")) {
      //处理标签
    }

    if (!node) {


    }

  }
  return nodes


}

export function parse(template) {
  const context = createParseContext(template)
  return parseChildren(context)
}


export function compile(template) {
  const ast = parse(template)
  return ast
}
