// packages/shared/src/index.ts
function isString(val) {
  return typeof val === "string";
}

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
  if (context.source.startsWith("</")) {
    return true;
  }
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
function getSelection(context, start, end) {
  end = getCursor(context);
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
function advanceSpaces(context) {
  const match = /^[ \t\r\n]+/.exec(context.source);
  if (match) {
    advanceBy(context, match[0].length);
  }
}
function parseAttributeValue(context) {
  const start = getCursor(context);
  const quote = context.source[0];
  let content;
  const isQuoteed = quote === '"' || quote === "'";
  if (isQuoteed) {
    advanceBy(context, 1);
    const endIndex = context.source.indexOf(quote);
    content = parseTextData(context, endIndex);
    advanceBy(context, 1);
  }
  return { content, loc: getSelection(context, start) };
}
function parseAttribute(context) {
  const start = getCursor(context);
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  const name = match[0];
  advanceBy(context, name.length);
  let value;
  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context);
    advanceBy(context, 1);
    advanceSpaces(context);
    value = parseAttributeValue(context);
  }
  const loc = getSelection(context, start);
  return {
    type: 6 /* ATTRIBUTE */,
    name,
    value: {
      type: 2 /* TEXT */,
      content: value.content
    },
    loc
  };
}
function parseAttributes(context) {
  const props = [];
  while (context.source.length > 0 && !context.source.startsWith(">")) {
    const attr = parseAttribute(context);
    props.push(attr);
    advanceSpaces(context);
  }
  return props;
}
function parseTag(context) {
  const start = getCursor(context);
  const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source);
  const tag = match[1];
  advanceBy(context, match[0].length);
  advanceSpaces(context);
  let props = parseAttributes(context);
  const isSelfClosing = context.source.startsWith("/>");
  advanceBy(context, isSelfClosing ? 2 : 1);
  return {
    type: 1 /* ELEMENT */,
    tag,
    isSelfClosing,
    loc: getSelection(context, start),
    props
  };
}
function parseInterpolation(context) {
  const start = getCursor(context);
  const closeIndex = context.source.indexOf("}}", 2);
  advanceBy(context, 2);
  const innerStart = getCursor(context);
  const innerEnd = getCursor(context);
  const rawContentLength = closeIndex - 2;
  const preTrimContent = parseTextData(context, rawContentLength);
  const content = preTrimContent.trim();
  const startOffest = preTrimContent.indexOf(content);
  if (startOffest > 0) {
    advancePositionWithMutation(innerStart, preTrimContent, startOffest);
  }
  const endOffset = content.length + startOffest;
  advancePositionWithMutation(innerEnd, preTrimContent, endOffset);
  advanceBy(context, 2);
  return {
    type: 5 /* INTERPOLATION */,
    content: {
      type: 4 /* SIMPLE_EXPRESSION */,
      isStatic: false,
      content,
      loc: getSelection(context, innerStart, innerEnd)
    },
    loc: getSelection(context, start)
  };
}
function parseElement(context) {
  let ele = parseTag(context);
  const children = parseChildren(context);
  if (context.source.startsWith("</")) {
    parseTag(context);
  }
  ele.loc = getSelection(context, ele.loc.start);
  ele.children = children;
  return ele;
}
function parseChildren(context) {
  const nodes = [];
  while (!isEnd(context)) {
    const s = context.source;
    let node;
    if (s.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (s[0] === "<") {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context);
      }
    }
    if (!node) {
      node = parseText(context);
    }
    nodes.push(node);
  }
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type == 2 /* TEXT */) {
      if (!/[^\t\r\n\f ]/.test(node.content)) {
        nodes[i] = null;
      } else {
        node.content = node.content.replace(/[\t\r\n\f ]+/g, " ");
      }
    }
  }
  return nodes.filter(Boolean);
}
function createRoot(children, loc) {
  return {
    type: 0 /* ROOT */,
    children,
    loc
  };
}
function baseParse(template) {
  const context = createParserContext(template);
  const start = getCursor(context);
  return createRoot(
    parseChildren(context),
    getSelection(context, start)
  );
}

// packages/compiler-core/src/runtimeHelpers.ts
var TO_DISPLAY_STRING = Symbol(`toDisplayString`);
var CREATE_TEXT = Symbol("createTextVNode");
var CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
var FRAGMENT = Symbol("FRAGMENT");
var CREATE_ELEMENT_BLOCK = Symbol(`createElementBlock`);
var OPEN_BLOCK = Symbol(`openBlock`);
var helperNameMap = {
  [TO_DISPLAY_STRING]: "toDisplayString",
  [CREATE_TEXT]: "createTextVNode",
  [CREATE_ELEMENT_VNODE]: "createElementVNode",
  [FRAGMENT]: "Fragment",
  [OPEN_BLOCK]: `openBlock`,
  [CREATE_ELEMENT_BLOCK]: `createElementBlock`
};
function createCallExpression(context, args) {
  context.helper(CREATE_TEXT);
  return {
    type: 14 /* JS_CALL_EXPRESSION */,
    arguments: args
  };
}
function createVNodeCall(context, tag, props, children) {
  context.helper(CREATE_ELEMENT_VNODE);
  return {
    type: 13 /* VNODE_CALL */,
    tag,
    props,
    children
  };
}
function createObjectExpression(properties) {
  return {
    type: 15 /* JS_OBJECT_EXPRESSION */,
    properties
  };
}

// packages/compiler-core/src/transform.ts
function isText(node) {
  return node.type == 5 /* INTERPOLATION */ || node.type == 2 /* TEXT */;
}
function transformElement(node, context) {
  if (node.type === 1 /* ELEMENT */) {
    return function postTransformElement() {
      let vnodeTag = `'${node.tag}'`;
      let properties = [];
      let props = node.props;
      for (let i = 0; i < props.length; i++) {
        properties.push({
          key: props[i].name,
          value: props[i].value.content
        });
      }
      const propsExpression = props.length > 0 ? createObjectExpression(properties) : null;
      let vnodeChildren = null;
      if (node.children.length === 1) {
        const child = node.children[0];
        vnodeChildren = child;
      } else {
        if (node.children.length > 0) {
          vnodeChildren = node.children;
        }
      }
      node.codegenNode = createVNodeCall(context, vnodeTag, propsExpression, vnodeChildren);
    };
  }
}
function transformText(node, context) {
  if (node.type === 1 /* ELEMENT */ || node.type === 0 /* ROOT */) {
    return () => {
      let hasText = false;
      const children = node.children;
      let currentContainer = void 0;
      for (let i = 0; i < children.length; i++) {
        let child = children[i];
        if (isText(child)) {
          hasText = true;
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = {
                  type: 8 /* COMPOUND_EXPRESSION */,
                  loc: child.loc,
                  children: [child]
                };
              }
              currentContainer.children.push(` + `, next);
              children.splice(j, 1);
              j--;
            } else {
              currentContainer = void 0;
              break;
            }
          }
        }
      }
      if (!hasText || children.length == 1) {
        return;
      }
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child) || child.type === 8 /* COMPOUND_EXPRESSION */) {
          const callArgs = [];
          callArgs.push(child);
          if (child.type !== 2 /* TEXT */) {
            callArgs.push(1 /* TEXT */ + "");
          }
          children[i] = {
            type: 12 /* TEXT_CALL */,
            content: child,
            loc: child.loc,
            codegenNode: createCallExpression(context, callArgs)
          };
        }
      }
    };
  }
}
function transformExpression(node, context) {
  if (node.type == 5 /* INTERPOLATION */) {
    node.content.content = `_ctx.${node.content.content}`;
  }
}
function traverseNode(node, context) {
  context.currentNode = node;
  const transforms = context.nodeTransforms;
  const exitsFns = [];
  for (let i2 = 0; i2 < transforms.length; i2++) {
    let onExit = transforms[i2](node, context);
    if (onExit) {
      exitsFns.push(onExit);
    }
    if (!context.currentNode)
      return;
  }
  switch (node.type) {
    case 1 /* ELEMENT */:
    case 0 /* ROOT */:
      for (let i2 = 0; i2 < node.children.length; i2++) {
        context.parent = node;
        traverseNode(node.children[i2], context);
      }
      break;
    case 5 /* INTERPOLATION */:
      context.helper(TO_DISPLAY_STRING);
      break;
  }
  context.currentNode = node;
  let i = exitsFns.length;
  while (i--) {
    exitsFns[i]();
  }
}
function createTransformContext(root) {
  const context = {
    currentNode: root,
    parent: null,
    nodeTransforms: [
      transformElement,
      transformText,
      transformExpression
    ],
    helpers: /* @__PURE__ */ new Map(),
    helper(name) {
      const count = context.helpers.get(name) || 0;
      context.helpers.set(name, count + 1);
      return name;
    },
    removeHelper(name) {
      const count = context.helpers.get(name);
      if (count) {
        const currentCount = count - 1;
        if (!currentCount) {
          context.helpers.delete(name);
        } else {
          context.helpers.set(name, currentCount);
        }
      }
    }
  };
  return context;
}
function createRootCodegen(root, context) {
  let { children } = root;
  if (children.length == 1) {
    const child = children[0];
    if (child.type === 1 /* ELEMENT */ && child.codegenNode) {
      const codegenNode = child.codegenNode;
      root.codegenNode = codegenNode;
      context.removeHelper(CREATE_ELEMENT_VNODE);
      context.helper(OPEN_BLOCK);
      context.helper(CREATE_ELEMENT_BLOCK);
      root.codegenNode.isBlock = true;
    } else {
      root.codegenNode = child;
    }
  } else {
    root.codegenNode = createVNodeCall(context, context.helper(FRAGMENT), void 0, root.children);
    context.helper(OPEN_BLOCK);
    context.helper(CREATE_ELEMENT_BLOCK);
    root.codegenNode.isBlock = true;
  }
}
function transform(root) {
  let context = createTransformContext(root);
  traverseNode(root, context);
  createRootCodegen(root, context);
  root.helpers = [...context.helpers.keys()];
  console.log("root=>", root);
}

// packages/compiler-core/src/index.ts
function createCodegenContext(ast) {
  const context = {
    code: ``,
    helper(key) {
      return `_${helperNameMap[key]}`;
    },
    indentLevel: 0,
    push(code) {
      context.code += code;
    },
    indent() {
      newline(++context.indentLevel);
    },
    deindent(withoutnewline = false) {
      if (withoutnewline) {
        --context.indentLevel;
      } else {
        newline(--context.indentLevel);
      }
    },
    newline
  };
  function newline(n) {
    context.push("\n" + `  `.repeat(n));
  }
  return context;
}
function genFunctionPreamble(ast, context) {
  const { push, newline } = context;
  if (ast.helpers.length > 0) {
    context.push(
      `import {${ast.helpers.map((helper) => `${helperNameMap[helper]} as _${helperNameMap[helper]}`).join(",")}} from "vue"`
    );
  }
  newline();
  newline();
  push(`export `);
}
function genText(node, context) {
  context.push(JSON.stringify(node.content));
}
function genExpression(node, context) {
  const { content } = node;
  context.push(content);
}
function genInterpolation(node, context) {
  const { push, helper } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(`)`);
}
function genNodeList(nodes, context) {
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(`${node}`);
    } else if (Array.isArray(node)) {
      genNodeList(node, context);
    } else {
      genNode(node, context);
    }
    if (i < nodes.length - 1) {
      push(", ");
    }
  }
}
function genVNodeCall(node, context) {
  const { push, helper } = context;
  const { tag, props, children, isBlock } = node;
  if (isBlock) {
    push(`(${helper(OPEN_BLOCK)}(),`);
  }
  const callHelper = isBlock ? CREATE_ELEMENT_BLOCK : CREATE_ELEMENT_VNODE;
  push(helper(callHelper));
  push("(");
  genNodeList([tag, props, children].map((item) => item || "null"), context);
  push(`)`);
  if (isBlock) {
    push(`)`);
  }
}
function genObjectExpression(node, context) {
  const { push, newline } = context;
  const { properties } = node;
  if (!properties.length) {
    push(`{}`);
    return;
  }
  push("{");
  for (let i = 0; i < properties.length; i++) {
    const { key, value } = properties[i];
    push(key);
    push(`: `);
    push(JSON.stringify(value));
    if (i < properties.length - 1) {
      push(`,`);
    }
  }
  push("}");
}
function genCompoundExpression(node, context) {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (isString(child)) {
      context.push(child);
    } else {
      genNode(child, context);
    }
  }
}
function genCallExpression(node, context) {
  const { push, helper } = context;
  const callee = helper(node.callee);
  push(callee + `(`, node);
  genNodeList(node.arguments, context);
  push(`)`);
}
function genNode(node, context) {
  if (typeof node === "symbol") {
    context.push(context.helper(FRAGMENT));
    return;
  }
  switch (node.type) {
    case 2 /* TEXT */:
      genText(node, context);
      break;
    case 5 /* INTERPOLATION */:
      genInterpolation(node, context);
      break;
    case 4 /* SIMPLE_EXPRESSION */:
      genExpression(node, context);
      break;
    case 13 /* VNODE_CALL */:
      genVNodeCall(node, context);
      break;
    case 15 /* JS_OBJECT_EXPRESSION */:
      genObjectExpression(node, context);
      break;
    case 1 /* ELEMENT */:
      genNode(node.codegenNode, context);
      break;
    case 8 /* COMPOUND_EXPRESSION */:
      genCompoundExpression(node, context);
      break;
    case 12 /* TEXT_CALL */:
      genNode(node.codegenNode, context);
      break;
    case 14 /* JS_CALL_EXPRESSION */:
      genCallExpression(node, context);
      break;
  }
}
function generate(ast) {
  const context = createCodegenContext(ast);
  const { push, indent } = context;
  genFunctionPreamble(ast, context);
  const functionName = "render";
  const args = ["_ctx", "$props"];
  push(`function ${functionName}(${args.join(", ")}){`);
  indent();
  push(`return `);
  if (ast.codegenNode) {
    genNode(ast.codegenNode, context);
  } else {
    push(`null`);
  }
  context.deindent();
  context.push(`}`);
  return context.code;
}
function compile(template) {
  const ast = baseParse(template);
  transform(ast);
  return generate(ast);
}
export {
  compile
};
//# sourceMappingURL=compiler-core.js.map
