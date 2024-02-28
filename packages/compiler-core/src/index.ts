import { isString } from "@vue/shared";
import { NodeTypes } from "./ast";
import { baseParse } from "./parser";
import { CREATE_ELEMENT_BLOCK, CREATE_ELEMENT_VNODE, FRAGMENT, OPEN_BLOCK, TO_DISPLAY_STRING, helperNameMap } from "./runtimeHelpers";
import { transform } from "./transform";


function createCodegenContext(ast) {
  const context = {
    code: ``,//存储拼接后的代码
    helper(key) { return `_${helperNameMap[key]}` },
    indentLevel: 0,
    push(code) {
      context.code += code;//拼接代码
    },
    indent() { // 前进
      newline(++context.indentLevel)
    },
    deindent(withoutnewline = false) { // 缩进
      if (withoutnewline) {
        --context.indentLevel
      } else {
        newline(--context.indentLevel)
      }

    },
    newline

  }
  function newline(n) {
    context.push('\n' + `  `.repeat(n))
  }

  return context
}



function genFunctionPreamble(ast, context) { // 生成函数
  const { push, newline } = context

  if (ast.helpers.length > 0) { // 生成导入语句
    context.push(
      `import {${ast.helpers
        .map((helper) => `${helperNameMap[helper]} as _${helperNameMap[helper]}`)
        .join(",")}} from "vue"`
    );
  }
  newline()
  newline()
  push(`export `)
}
function genText(node, context) {
  context.push(JSON.stringify(node.content)) // 添加文本代码
}

function genExpression(node, context) {
  const { content } = node
  context.push(content)
}
function genInterpolation(node, context) {
  const { push, helper } = context
  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(`)`)
}

function genNodeList(nodes, context) { // 生成节点列表，用","分割
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(`${node}`); // 如果是字符串直接放入
    } else if (Array.isArray(node)) {
      genNodeList(node, context)
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
  const { tag, props, children, isBlock } = node

  if (isBlock) {
    push(`(${helper(OPEN_BLOCK)}(),`)
  }
  // 生成createElementBlock或者createElementVnode
  const callHelper = isBlock ? CREATE_ELEMENT_BLOCK : CREATE_ELEMENT_VNODE;
  push(helper(callHelper));
  push('(');
  genNodeList([tag, props, children].map(item => item || 'null'), context);
  push(`)`)
  if (isBlock) {
    push(`)`)
  }
}
function genObjectExpression(node, context) {
  const { push, newline } = context
  const { properties } = node
  if (!properties.length) {
    push(`{}`)
    return
  }
  push('{')
  for (let i = 0; i < properties.length; i++) {
    const { key, value } = properties[i]
    // key
    push(key);
    push(`: `)
    push(JSON.stringify(value));
    // value
    if (i < properties.length - 1) {
      push(`,`)
    }
  }
  push('}')
}
function genCompoundExpression(node, context) {
  for (let i = 0; i < node.children!.length; i++) {
    const child = node.children![i]
    if (isString(child)) {
      context.push(child)
    } else {
      genNode(child, context)
    }
  }
}

function genCallExpression(node, context) {
  const { push, helper } = context
  const callee = helper(node.callee)

  push(callee + `(`, node)
  genNodeList(node.arguments, context)
  push(`)`)
}

function genNode(node, context) {
  if (typeof node === 'symbol') {
    context.push(context.helper(FRAGMENT))
    return
  }
  switch (node.type) {
    case NodeTypes.TEXT: // 生成文本
      genText(node, context)
      break;
    case NodeTypes.INTERPOLATION: // 生成表达式
      genInterpolation(node, context)
      break;
    case NodeTypes.SIMPLE_EXPRESSION: // 简单表达式的处理
      genExpression(node, context)
      break
    case NodeTypes.VNODE_CALL: // 元素调用
      genVNodeCall(node, context);
      break;
    case NodeTypes.JS_OBJECT_EXPRESSION: // 元素属性
      genObjectExpression(node, context)
      break
    case NodeTypes.ELEMENT:
      genNode(node.codegenNode, context)
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
      break
    case NodeTypes.TEXT_CALL: // 对文本处理
      genNode(node.codegenNode, context)
      break
    case NodeTypes.JS_CALL_EXPRESSION: // 表达式处理
      genCallExpression(node, context)
      break

  }
}

function generate(ast) {
  const context = createCodegenContext(ast)
  const { push, indent } = context
  genFunctionPreamble(ast, context);
  const functionName = 'render';
  const args = ['_ctx', '$props'];
  push(`function ${functionName}(${args.join(', ')}){`)
  indent();
  push(`return `)
  if (ast.codegenNode) {
    genNode(ast.codegenNode, context)
  } else {
    push(`null`)
  }
  context.deindent();
  context.push(`}`);
  return context.code
}


export function compile(template) {
  // 1.将模板转化成ast语法树
  const ast = baseParse(template);
  // 2.对ast语法树进行转化
  transform(ast) // 对ast语法树进行转化  给ast节点是增加一些额外的信息  codegenNode, 收集需要导入的方法


  // 3.将ast语法树转化成代码
  const code = generate(ast)
  console.log(code)
  // return generate(ast)

}
