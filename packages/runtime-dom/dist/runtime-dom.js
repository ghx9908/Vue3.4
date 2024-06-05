// packages/runtime-dom/src/nodeOps.ts
var nodeOps = {
  insert: (child, parent, anchor) => parent.insertBefore(child, anchor || null),
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
  nextSibing: (node) => node.nextSibing,
  querySelector: (selector) => document.querySelector(selector)
};

// packages/runtime-dom/src/patchProp.ts
var patchProp = (el, key, preValue, nextValue) => {
  if (key === "class") {
    patchClass(el, nextValue);
  } else if (key === "style") {
    pathStyle(el, preValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    pathEvent(el, key, nextValue);
  } else {
    patchAttr(el, key, nextValue);
  }
};
function patchClass(el, value) {
  if (value === null) {
    el.removeAttribute("class");
  } else {
    el.class = value;
  }
}
function pathStyle(el, pre, next) {
  for (let key in next) {
    el.style[key] = next[key];
  }
  if (pre) {
    for (let key in pre) {
      if (next[key] === null) {
        el.style[key] = null;
      }
    }
  }
}
var createInvoker = (initiaValue) => {
  const invoker = (e) => invoker.value(e);
  invoker.value = initiaValue;
  return invoker;
};
function pathEvent(el, rawName, nextValue) {
  const invokers = el._vei || (el._vei = {});
  const exisitingInvoker = invokers[rawName];
  if (nextValue && exisitingInvoker) {
    exisitingInvoker.value = nextValue;
  }
  if (nextValue && !exisitingInvoker) {
    const name = rawName.slice(2).toLowerCase();
    const invoker = invokers[rawName] = createInvoker(nextValue);
    el.addEventListener(name, invoker);
  }
  if (!nextValue && exisitingInvoker) {
    el.removeEventListener(rawName.slice(2).toLowerCase(), exisitingInvoker);
    invokers[rawName] = void 0;
  }
}
function patchAttr(el, key, nextValue) {
  if (nextValue === null || nextValue === void 0) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, nextValue);
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
function isVNode(value) {
  return value.__v_isVNode === true;
}
function createVNode(type, props, children = null) {
  const shapeFlag = isString(type) ? 1 /* ELEMENT */ : 0;
  const vnode = {
    __v_isVNode: true,
    type,
    props,
    key: props && props["key"],
    el: null,
    children,
    shapeFlag
  };
  if (children) {
    let type2 = 0;
    if (Array.isArray(children)) {
      type2 = 16 /* ARRAY_CHILDREN */;
    } else {
      children = String(children);
      type2 = 8 /* TEXT_CHILDREN */;
    }
    vnode.shapeFlag |= type2;
  }
  return vnode;
}

// packages/runtime-core/src/h.ts
function h(type, propsOrChildern, children) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildern) && !Array.isArray(propsOrChildern)) {
      if (isVNode(propsOrChildern)) {
        return createVNode(type, null, [propsOrChildern]);
      }
      return createVNode(type, propsOrChildern);
    } else {
      return createVNode(type, null, propsOrChildern);
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVNode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildern, children);
  }
}

// packages/runtime-core/src/createVNode1.ts
var Text = Symbol("Text");
var Fragment = Symbol("Fragment");
function isVNode2(val) {
  return !!(val && val.__v_isVNode);
}
function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
function createVNode2(type, props, children = null) {
  const shapeFlag = isString(type) ? 1 /* ELEMENT */ : isObject(type) ? 4 /* STATEFUL_COMPONENT */ : isFunction(type) ? 2 /* FUNCTIONAL_COMPONENT */ : 0;
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
  function mountChildren(children, container) {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], container);
    }
  }
  function mountElement(vnode, container) {
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
    hostInsert(el, container);
  }
  function patch(n1, n2, container) {
    if (n1 == n2) {
      return;
    }
    if (n1 == null) {
      mountElement(n2, container);
    } else {
    }
  }
  function unmount(vnode) {
    hostRemove(vnode.el);
  }
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

// packages/reactivity/src/effect.ts
var activeEffect;
function effect(fn, option) {
  console.log("1=>", 1);
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
  if (option) {
    Object.assign(_effect, option);
  }
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}
function preCleanupEffect(effect2) {
  effect2._trackId++;
  effect2._depsLength = 0;
}
function cleanupDepEffect(dep, effect2) {
  dep.delete(effect2);
  if (dep.size === 0) {
    dep.cleanup();
  }
}
function postCleanupEffect(effect2) {
  if (effect2.deps.length > effect2._depsLength) {
    for (let i = effect2._depsLength; i < effect2.deps.length; i++) {
      cleanupDepEffect(effect2.deps[i], effect2);
    }
    effect2.deps.length = effect2._depsLength;
  }
}
var ReactiveEffect = class {
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    this.active = true;
    this.deps = [];
    this._trackId = 0;
    this._depsLength = 0;
    this._running = 0;
    this._dirtyLevel = 4 /* Dirty */;
  }
  get dirty() {
    return this._dirtyLevel === 4 /* Dirty */;
  }
  set dirty(val) {
    this._dirtyLevel = val ? 4 /* Dirty */ : 0 /* NotDirty */;
  }
  stop() {
    if (this.active) {
      preCleanupEffect(this);
      postCleanupEffect(this);
      this.active = false;
    }
  }
  run() {
    this._dirtyLevel = 0 /* NotDirty */;
    if (!this.active) {
      return this.fn();
    }
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      this._running++;
      preCleanupEffect(this);
      return this.fn();
    } finally {
      this._running--;
      postCleanupEffect(this);
      activeEffect = lastEffect;
    }
  }
};
function trackEffect(effect2, dep) {
  if (dep.get(effect2) !== effect2._trackId) {
    dep.set(effect2, effect2._trackId);
    const oldDep = effect2.deps[effect2._depsLength];
    if (oldDep !== dep) {
      if (oldDep) {
        cleanupDepEffect(oldDep, effect2);
      }
      effect2.deps[effect2._depsLength++] = dep;
    } else {
      effect2._depsLength++;
    }
  }
}
function triggerEffects(dep) {
  for (const effect2 of dep.keys()) {
    if (effect2._dirtyLevel < 4 /* Dirty */) {
      effect2._dirtyLevel = 4 /* Dirty */;
    }
    if (effect2._running === 0) {
      if (effect2.scheduler) {
        effect2.scheduler();
      }
    }
  }
}

// packages/reactivity/src/reactiveEffect.ts
var targetMap = /* @__PURE__ */ new WeakMap();
function createDep(cleanup, key) {
  const deps = /* @__PURE__ */ new Map();
  deps.cleanup = cleanup;
  deps.key = key;
  return deps;
}
function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = createDep(() => dep.delete(key), key));
    }
    trackEffect(activeEffect, dep);
  }
}
function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap)
    return;
  const dep = depsMap.get(key);
  if (dep) {
    triggerEffects(dep);
  }
}

// packages/reactivity/src/baseHandlers.ts
var mutanleHandler = {
  get(target, key, receiver) {
    if (key === "__v_isReactive" /* IS_REACTIVE */)
      return true;
    track(target, key);
    const res = Reflect.get(target, key, receiver);
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  },
  set(target, key, value, receiver) {
    const oldValue = target.key;
    const result = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }
    return result;
  }
};

// packages/reactivity/src/reactivity.ts
function toReactive(object) {
  return isObject(object) ? reactive(object) : object;
}
var reactiveMap = /* @__PURE__ */ new WeakMap();
function reactive(target) {
  return createReactiveObject(target, false);
}
function shallowReactive(target) {
  return createReactiveObject(target, true);
}
function createReactiveObject(target, isReadonly) {
  if (target["__v_isReactive" /* IS_REACTIVE */])
    return target;
  if (!isObject(target))
    return target;
  const exisitingProxy = reactiveMap.get(target);
  if (exisitingProxy)
    return exisitingProxy;
  const proxy = new Proxy(target, mutanleHandler);
  reactiveMap.set(target, proxy);
  return proxy;
}
function isReactive(value) {
  return value && value["__v_isReactive" /* IS_REACTIVE */];
}

// packages/reactivity/src/ref.ts
function isRef(value) {
  return !!(value && value.__v_isRef);
}
function ref(value) {
  return createRef(value, false);
}
function shallowRef(value) {
  return createRef(value, true);
}
function createRef(rawValue, shallow) {
  return new RefImpl(rawValue, shallow);
}
var RefImpl = class {
  constructor(rawValue, _shallow) {
    this.rawValue = rawValue;
    this._shallow = _shallow;
    this.__Is_Ref = true;
    this._value = _shallow ? rawValue : toReactive(rawValue);
  }
  get value() {
    tarckRefEffect(this);
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this._value = this._shallow ? newValue : toReactive(newValue);
      this.rawValue = newValue;
      triggerRefEffect(this);
    }
  }
};
function tarckRefEffect(ref2) {
  if (activeEffect) {
    trackEffect(activeEffect, ref2.dep = ref2.dep || createDep(() => ref2.dep = void 0, ref2._value));
  }
}
function triggerRefEffect(ref2) {
  const dep = ref2.dep;
  if (dep) {
    triggerEffects(dep);
  }
}
var ObjectRefImpl = class {
  constructor(_object, _key) {
    this._object = _object;
    this._key = _key;
    this.__v_isRef = true;
  }
  get value() {
    return this._object[this._key];
  }
  set value(newValue) {
    this._object[this._key] = newValue;
  }
};
function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}
function toRefs(object, key) {
  const ret = Array.isArray(object) ? new Array(object.length) : {};
  for (let key2 in object) {
    ret[key2] = new ObjectRefImpl(object, key2);
  }
  return ret;
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

// packages/reactivity/src/apiWatch.ts
function watch(source, cb, option) {
  return doWatch(source, cb, option);
}
function watchEffect(effect2, option) {
  return doWatch(effect2, null, option);
}
function doWatch(source, cb, { immediate, deep }) {
  let getter;
  if (isFunction(source)) {
    getter = source;
  } else if (isReactive(source)) {
    getter = () => traverse(source, deep === false ? 1 : void 0);
  } else if (isRef(source)) {
    getter = () => source.value;
  }
  let cleanup;
  function onCleanup(fn) {
    cleanup = () => {
      fn();
      cleanup = void 0;
    };
  }
  const job = () => {
    if (cb) {
      if (cleanup) {
        cleanup();
      }
      let newVal = effect2.run();
      cb(newVal, oldVal, onCleanup);
      oldVal = newVal;
    } else {
      effect2.run();
    }
  };
  const effect2 = new ReactiveEffect(getter, job);
  const noWatch = () => {
    effect2.stop();
  };
  let oldVal;
  if (cb) {
    if (immediate) {
      job();
    }
  } else {
    oldVal = effect2.run();
  }
  return noWatch;
}
function traverse(value, depth = Infinity, seen = /* @__PURE__ */ new Set()) {
  if (depth <= 0) {
    return value;
  }
  if (!isObject(value)) {
    return value;
  }
  if (seen.has(value)) {
    return value;
  }
  depth--;
  seen.add(value);
  for (let key in value) {
    traverse(value[key], depth, seen);
  }
  return value;
}

// packages/reactivity/src/computed.ts
var ComputedRefImpl = class {
  constructor(getter, setter) {
    this.getter = getter;
    this.setter = setter;
    this.effect = new ReactiveEffect(getter, () => triggerRefEffect(this));
  }
  get value() {
    if (this.effect.dirty) {
      this._value = this.effect.run();
      tarckRefEffect(this);
    }
    return this._value;
  }
  set value(newValue) {
    this.setter(newValue);
  }
};
function computed(getterOrOptions) {
  let getter;
  let setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => {
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}

// packages/runtime-dom/src/index.ts
var renderOptions = Object.assign({ patchProp }, nodeOps);
function render(vnode, container) {
  createRenderer(renderOptions).render(vnode, container);
}
export {
  Fragment,
  ReactiveEffect,
  Text,
  activeEffect,
  computed,
  createReactiveObject,
  createRef,
  createRenderer,
  createVNode2 as createVNode,
  effect,
  h,
  isReactive,
  isRef,
  isSameVNodeType,
  isVNode2 as isVNode,
  proxyRefs,
  reactive,
  ref,
  render,
  renderOptions,
  shallowReactive,
  shallowRef,
  tarckRefEffect,
  toReactive,
  toRef,
  toRefs,
  trackEffect,
  triggerEffects,
  triggerRefEffect,
  watch,
  watchEffect
};
//# sourceMappingURL=runtime-dom.js.map
