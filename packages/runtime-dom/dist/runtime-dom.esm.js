// packages/runtime-dom/src/nodeOps.ts
var nodeOps = {
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null);
  },
  remove: (child) => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  createElement: (tag) => document.createElement(tag),
  createText: (text) => document.createTextNode(text),
  setText: (node, text) => node.nodeValue = text,
  setElementText: (el, text) => el.textContent = text,
  parentNode: (node) => node.parentNode,
  nextSibling: (node) => node.nextSibling,
  querySelector: (selector) => document.querySelector(selector)
};

// packages/runtime-dom/src/patchProp.ts
var patchProp = (el, key, prevValue, nextValue) => {
  if (key === "class") {
    patchClass(el, nextValue);
  } else if (key === "style") {
    patchStyle(el, prevValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    patchEvent(el, key, nextValue);
  } else {
    patchAttr(el, key, nextValue);
  }
};
function patchClass(el, value) {
  if (value == null) {
    el.removeAttribute("class");
  } else {
    el.className = value;
  }
}
function patchStyle(el, prev, next) {
  const style = el.style;
  for (const key in next) {
    style[key] = next[key];
  }
  if (prev) {
    for (const key in prev) {
      if (next[key] == null) {
        style[key] = null;
      }
    }
  }
}
function createInvoker(initialValue) {
  const invoker = (e) => invoker.value(e);
  invoker.value = initialValue;
  return invoker;
}
function patchEvent(el, rawName, nextValue) {
  const invokers = el._vei || (el._vei = {});
  const exisitingInvoker = invokers[rawName];
  if (nextValue && exisitingInvoker) {
    exisitingInvoker.value = nextValue;
  } else {
    const name = rawName.slice(2).toLowerCase();
    if (nextValue) {
      const invoker = invokers[rawName] = createInvoker(nextValue);
      el.addEventListener(name, invoker);
    } else if (exisitingInvoker) {
      el.removeEventListener(name, exisitingInvoker);
      invokers[rawName] = void 0;
    }
  }
}
function patchAttr(el, key, value) {
  if (value == null) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
}

// packages/runtime-dom/src/index.ts
var renderOptions = Object.assign({ patchProp }, nodeOps);
//# sourceMappingURL=runtime-dom.esm.js.map
