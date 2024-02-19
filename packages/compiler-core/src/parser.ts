import { NodeTypes } from "./ast";

/**
 * 创建解析器上下文
 *
 * @param content 内容
 * @returns 返回解析器上下文对象
 */
function createParserContext(content) {
  return {
    // 行数
    line: 1,
    // 列数
    column: 1,
    // 偏移量
    offset: 0,
    // 源代码
    source: content, // source会不停的被截取
    // 原始源代码
    originalSource: content // 原始内容
  }
}
/**
 * 判断是否到达源代码的结尾。
 *
 * @param context - 函数运行上下文。
 * @returns 如果源代码为空，则返回true，否则返回false。
 */
function isEnd(context) {
  const source = context.source;
  return !source;
}


/**
 * 更新最新上下文信息
 *
 * @param context 上下文对象
 * @param s 字符串
 * @param endIndex 结束索引
 */
function advancePositionWithMutation(context, s, endIndex) { // 更新最新上下文信息
  let linesCount = 0; // 计算行数
  let linePos = -1; // 计算起始行开始位置
  for (let i = 0; i < endIndex; i++) {
    if (s.charCodeAt(i) === 10) { // 遇到\n就增加一行
      linesCount++;
      linePos = i; // 记录换行后的字节位置
    }
  }
  context.offset += endIndex; // 累加偏移量
  context.line += linesCount; // 累加行数
  // 计算列数，如果无换行,则直接在原列基础 + 文本末尾位置，否则 总位置减去换行后的字节位置
  context.column = linePos == -1 ? context.column + endIndex : endIndex - linePos
}

function advanceBy(context, endIndex) {
  let s = context.source;
  advancePositionWithMutation(context, s, endIndex) // 更改位置信息
  // 删除解析后的内容
  context.source = s.slice(endIndex);
}
function parseTextData(context, endIndex) {
  const rawText = context.source.slice(0, endIndex);
  // 删除已经解析的内容
  advanceBy(context, endIndex); // 截取内容
  return rawText
}

function getCursor(context) { // 获取当前位置
  let { line, column, offset } = context;
  return { line, column, offset }
}

function getSelection(context, start) {
  const end = getCursor(context);
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset)
  }
}
/**
 * 解析文本
 *
 * @param context 解析上下文
 * @returns 返回解析后的文本
 */
function parseText(context) { // 123123{{name}}</div>
  const endTokens = ['<', '{{'];
  let endIndex = context.source.length; // 文本的总长度
  // 假设遇到 < 就是文本的结尾 。 在假设遇到{{ 是文本结尾。 最后找离的近的
  // 假设法
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }
  let start = getCursor(context); // 1.获取文本开始位置
  const content = parseTextData(context, endIndex); // 2.处理文本数据
  return {
    type: NodeTypes.TEXT,// 文本类型
    content, // 文本内容
    loc: getSelection(context, start) // 3.获取文本位置信息ßß
  }

}
function parseChildren(context) {
  const nodes = [];// 存储解析后的节点
  while (!isEnd(context)) {
    const s = context.source; // 获取当前内容
    let node;// 存储当前节点
    if (s.startsWith('{{')) { // 处理表达式类型
      node = {}
    } else if (s[0] === '<') { // 标签的开头

      if (/[a-z]/i.test(s[1])) {
        node = {}
      } // 开始标签
    }
    if (!node) { // 文本的处理
      node = parseText(context);

    }
    nodes.push(node);
    break
  }
  return nodes;
}
/**
 * 将给定的模板解析为抽象语法树。
 *
 * @param template 要解析的模板
 * @returns 返回解析后的抽象语法树
 */
export function baseParse(template) {
  // 创建解析上下文 行数 列数 源代码
  const context = createParserContext(template);
  return parseChildren(context);
}


