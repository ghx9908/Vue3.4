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

// packages/shared/src/index.ts
var isObject = (value) => {
  return value !== null && typeof value === "object";
};
var isFunction = (value) => {
  return typeof value === "function";
};
function isString(val) {
  return typeof val === "string";
}

// packages/runtime-core/src/createVNode.ts
var Text = Symbol("Text");
var Fragment = Symbol("Fragment");
function isVNode(val) {
  return !!(val && val.__v_isVNode);
}
function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
function createVNode(type, props, children = null) {
  const shapeFlag = isString(type) ? 1 /* ELEMENT */ : isObject(type) ? 4 /* STATEFUL_COMPONENT */ : 0;
  const vnode = {
    shapeFlag,
    __v_isVNode: true,
    type,
    props,
    key: props && props.key,
    el: null,
    children
  };
  if (children) {
    let type2 = 0;
    if (Array.isArray(children)) {
      type2 = 16 /* ARRAY_CHILDREN */;
    } else {
      type2 = 8 /* TEXT_CHILDREN */;
    }
    vnode.shapeFlag |= type2;
  }
  return vnode;
}

// packages/runtime-core/src/h.ts
function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }
      return createVNode(type, propsOrChildren);
    } else {
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVNode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}

// packages/reactivity/src/effect.ts
var activeEffect = void 0;
function cleanupEffect(effect) {
  const { deps } = effect;
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect);
  }
  effect.deps.length = 0;
}
var ReactiveEffect = class {
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    this.active = true;
    this.deps = [];
    this.parent = void 0;
  }
  run() {
    try {
      if (!this.active) {
        return this.fn();
      }
      this.parent = activeEffect;
      activeEffect = this;
      cleanupEffect(this);
      return this.fn();
    } finally {
      activeEffect = this.parent;
      this.parent = void 0;
    }
  }
  stop() {
    if (this.active) {
      cleanupEffect(this);
      this.active = false;
    }
  }
};
var targetMap = /* @__PURE__ */ new WeakMap();
function track(target, type, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = /* @__PURE__ */ new Set());
    }
    trackEffects(dep);
  }
}
function trigger(target, type, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const effects = depsMap.get(key);
  triggerEffects(effects);
}
function triggerEffects(effects) {
  if (effects) {
    effects = [...effects];
    effects.forEach((effect) => {
      if (activeEffect !== effect) {
        if (effect.scheduler) {
          effect.scheduler();
        } else {
          effect.run();
        }
      }
    });
  }
}
function trackEffects(dep) {
  let shouldTrack = !dep.has(activeEffect);
  if (shouldTrack) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}

// packages/reactivity/src/ref.ts
function isRef(value) {
  return !!(value && value.__v_isRef);
}
function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      let v = Reflect.get(target, key, receiver);
      return v.__v_isRef ? v.value : v;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      if (oldValue.__v_isRef) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    }
  });
}

// packages/reactivity/src/baseHandlers.ts
var muableHandlers = {
  get(target, key, receiver) {
    if (key === "__v_isReactive" /* IS_REACTIVE */) {
      return true;
    }
    const res = Reflect.get(target, key, receiver);
    track(target, "get", key);
    if (isRef(target[key])) {
      return target[key].value;
    }
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  },
  set(target, key, value, receiver) {
    let oldValue = target[key];
    const result = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, "set", key, value, oldValue);
    }
    return result;
  }
};

// packages/reactivity/src/reactivity.ts
var reactiveMap = /* @__PURE__ */ new WeakMap();
function reactive(target) {
  if (!isObject(target))
    return target;
  let existingProxy = reactiveMap.get(target);
  if (existingProxy)
    return existingProxy;
  if (target["__v_isReactive" /* IS_REACTIVE */]) {
    return target;
  }
  const proxy = new Proxy(target, muableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}

// packages/runtime-core/src/componentProps.ts
function initProps(instance, rawProps) {
  const props = {};
  const attrs = {};
  const options = instance.propsOptions || {};
  if (rawProps) {
    for (let key in rawProps) {
      if (key in options) {
        props[key] = rawProps[key];
      } else {
        attrs[key] = rawProps[key];
      }
    }
  }
  instance.props = reactive(props);
  instance.attrs = attrs;
}

// packages/runtime-core/src/component.ts
function createInstance(n2) {
  const instance = {
    setupState: {},
    state: {},
    isMounted: false,
    vnode: n2,
    subTree: null,
    update: null,
    propsOptions: n2.type.props,
    props: {},
    attrs: {},
    slots: {},
    render: null,
    proxy: null
  };
  return instance;
}
function setupComponent(instance) {
  let { type, props } = instance.vnode;
  const publicProperties = {
    $attrs: (instance2) => instance2.attrs,
    $props: (instance2) => instance2.props
  };
  instance.proxy = new Proxy(instance, {
    get(target, key) {
      const { state, props: props2, setupState } = target;
      if (key in state) {
        return state[key];
      } else if (key in setupState) {
        return setupState[key];
      } else if (key in props2) {
        return props2[key];
      }
      const getter = publicProperties[key];
      if (getter) {
        return getter(instance);
      }
    },
    set(target, key, value) {
      const { state, props: props2, setupState } = target;
      if (key in state) {
        state[key] = value;
        return true;
      } else if (key in setupState) {
        setupState[key] = value;
        return true;
      } else if (key in props2) {
        console.warn(
          `mutate prop ${key} not allowed, props are readonly`
        );
        return false;
      }
      return true;
    }
  });
  initProps(instance, props);
  const setup = type.setup;
  if (setup) {
    const setupResult = setup(instance.props, {
      attrs: instance.attrs,
      emit: (eventName, ...args) => {
        let handler = props[`on${eventName[0].toUpperCase()}${eventName.slice(1)}`];
        handler && handler(...args);
      },
      slots: instance.slots,
      expose: () => {
      }
    });
    if (isObject(setupResult)) {
      instance.setupState = proxyRefs(setupResult);
    } else if (isFunction(setupResult)) {
      instance.render = setupResult;
    }
  }
  const data = type.data;
  if (data) {
    instance.state = reactive(data());
  }
  !instance.render && (instance.render = type.render);
}

// packages/runtime-core/src/renderer.ts
function createRenderer(options) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling
  } = options;
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], container);
    }
  };
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };
  const mountElement = (vnode, container, anchor) => {
    const { type, props, shapeFlag } = vnode;
    let el = vnode.el = hostCreateElement(type);
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      hostSetElementText(el, vnode.children);
    } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
      mountChildren(vnode.children, el);
    }
    hostInsert(el, container, anchor);
  };
  const patchProps = (oldProps, newProps, el) => {
    for (let key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    for (let key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };
  const patchKeyedChildren = (c1, c2, el) => {
    var _a;
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (i > e1) {
      if (i <= e2) {
        while (i <= e2) {
          const nextPos = e2 + 1;
          const anchor = (_a = c2[nextPos]) == null ? void 0 : _a.el;
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i]);
        i++;
      }
    }
    let s1 = i;
    let s2 = i;
    const keyToNewIndexMap = /* @__PURE__ */ new Map();
    for (let i2 = s2; i2 <= e2; i2++) {
      const nextChild = c2[i2];
      keyToNewIndexMap.set(nextChild.key, i2);
    }
    const toBePatched = e2 - s2 + 1;
    const newIndexToOldMapIndex = new Array(toBePatched).fill(0);
    for (let i2 = s1; i2 <= e1; i2++) {
      const prevChild = c1[i2];
      let newIndex = keyToNewIndexMap.get(prevChild.key);
      if (newIndex == void 0) {
        unmount(prevChild);
      } else {
        newIndexToOldMapIndex[newIndex - s2] = i2 + 1;
        patch(prevChild, c2[newIndex], el);
      }
    }
    console.log("newIndexToOldMapIndex=>", newIndexToOldMapIndex);
    for (let i2 = toBePatched - 1; i2 >= 0; i2--) {
      const nextIndex = s2 + i2;
      const nextChild = c2[nextIndex];
      let anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null;
      if (newIndexToOldMapIndex[i2] == 0) {
        patch(null, nextChild, el, anchor);
      } else {
        hostInsert(nextChild.el, el, anchor);
      }
    }
  };
  const patchChildren = (n1, n2, el) => {
    const c1 = n1 && n1.children;
    let c2 = n2.children;
    let prevShapeFlag = n1.shapeFlag;
    let shapeFlag = n2.shapeFlag;
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
          patchKeyedChildren(c1, c2, el);
        } else {
          unmountChildren(c1);
        }
      } else {
        patchKeyedChildren(c1, c2, el);
        if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
          hostSetElementText(el, "");
        }
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
          mountChildren(c2, el);
        }
      }
    }
  };
  const patchElement = (n1, n2) => {
    let el = n2.el = n1.el;
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    patchProps(oldProps, newProps, el);
    patchChildren(n1, n2, el);
  };
  function processText(n1, n2, container) {
    if (n1 == null) {
      hostInsert(n2.el = hostCreateText(n2.children), container);
    } else {
      let el = n2.el = n1.el;
      if (n2.children != n1.children) {
        hostSetText(el, n2.children);
      }
    }
  }
  const processFragment = (n1, n2, container) => {
    if (n1 == null) {
      mountChildren(n2.children, container);
    } else {
      patchChildren(n1, n2, container);
    }
  };
  function processElement(n1, n2, container, anchor) {
    if (n1 == null) {
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2);
    }
  }
  function setupRenderEffect(instance, container) {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        const subTree = instance.render.call(instance.proxy, instance.proxy);
        instance.subTree = subTree;
        patch(null, subTree, container);
        instance.isMounted = true;
      } else {
        const subTree = instance.render.call(instance.proxy, instance.proxy);
        patch(instance.subTree, subTree, container);
        instance.subTree = subTree;
      }
    };
    const effect = new ReactiveEffect(componentUpdateFn);
    const update = instance.update = effect.run.bind(effect);
    update();
  }
  function mountComponent(n2, container) {
    const instance = n2.component = createInstance(n2);
    setupComponent(instance);
    setupRenderEffect(instance, container);
  }
  const processComponent = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountComponent(n2, container);
    } else {
    }
  };
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 == n2) {
      return;
    }
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1);
      n1 = null;
    }
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container);
        break;
      default:
        if (shapeFlag & 1 /* ELEMENT */) {
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & 6 /* COMPONENT */) {
          processComponent(n1, n2, container, anchor);
        }
    }
  };
  const unmount = (vnode) => {
    if (vnode.type === Fragment) {
      return unmountChildren(vnode.children);
    }
    hostRemove(vnode.el);
  };
  const render2 = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
  };
  return {
    render: render2
  };
}

// packages/runtime-dom/src/index.ts
var renderOptions = Object.assign({ patchProp }, nodeOps);
var render = (vnode, container) => {
  createRenderer(renderOptions).render(vnode, container);
};
export {
  Fragment,
  Text,
  createRenderer,
  createVNode,
  h,
  isSameVNodeType,
  isVNode,
  render
};
//# sourceMappingURL=runtime-dom.esm.js.map
