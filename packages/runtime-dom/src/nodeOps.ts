// 这里存放常见DOM操作API，不同运行时提供的具体实现不一样，
// 最终将操作方法传递到runtime-core中，所以runtime-core不需要关心平台相关代码~

export const nodeOps = {
  insert: (child, parent, anchor) => { // 添加节点
    parent.insertBefore(child, anchor || null);
  },
  remove: child => { // 节点删除
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  createElement: (tag) => document.createElement(tag),// 创建节点
  createText: text => document.createTextNode(text),// 创建文本
  setText: (node, text) => node.nodeValue = text, //  设置文本节点内容
  setElementText: (el, text) => el.textContent = text, // 设置文本元素中的内容
  parentNode: node => node.parentNode, // 父亲节点
  nextSibling: node => node.nextSibling, // 下一个节点
  querySelector: selector => document.querySelector(selector) // 搜索元素
}
