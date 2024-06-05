export const nodeOps = {
  insert: (child, parent, anchor) => parent.insertBefore(child, anchor || null),
  remove: child => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  createElement: tag => document.createElement(tag),
  createText: text => document.createTextNode(text),
  setText: (node, text) => node.nodeValue = text,
  setElementText: (el, text) => el.textContent = text,
  parentNode: node => node.parentNode,
  nextSibing: node => node.nextSibing,
  querySelector: selector => document.querySelector(selector)
}
