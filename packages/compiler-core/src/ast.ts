export const enum NodeTypes {
  ROOT, // 根节点
  ELEMENT, // 元素
  TEXT, // 文本
  COMMENT, // 注释
  SIMPLE_EXPRESSION, // 简单表达式
  INTERPOLATION, // 模板表达式
  ATTRIBUTE,
  DIRECTIVE,
  // containers
  COMPOUND_EXPRESSION, // 复合表达式
  IF,
  IF_BRANCH,
  FOR,
  TEXT_CALL, // 文本调用
  // codegen
  VNODE_CALL, // 元素调用
  JS_CALL_EXPRESSION, // js调用表达式
}
