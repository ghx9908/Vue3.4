import { NodeTypes } from "./ast";
import { baseParse } from "./parser";
import { TO_DISPLAY_STRING, helperNameMap } from "./runtimeHelpers";
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

function genNode(node, context) {
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
