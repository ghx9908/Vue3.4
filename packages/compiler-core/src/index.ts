import { baseParse } from "./parser";
import { transform } from "./transform";

export function compile(template) {
  // 1.将模板转化成ast语法树
  const ast = baseParse(template);
  // 2.对ast语法树进行转化
  transform(ast) // 对ast语法树进行转化  给ast节点是增加一些额外的信息  codegenNode, 收集需要导入的方法

  console.log('ast=>', ast)

}
