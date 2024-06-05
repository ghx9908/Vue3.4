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
    debugger;
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
var Text = Symbol("Text");
var Fragment = Symbol("Fragment");
function isVNode(val) {
  return !!(val && val.__v_isVNode);
}
function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
function createVNode(type, props, children = null) {
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

// packages/runtime-core/src/scheduler.ts
var queue = [];
var isFlushing = false;
var p = Promise.resolve();
function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  if (!isFlushing) {
    isFlushing = true;
    p.then(() => {
      isFlushing = false;
      let copyQueue = queue.slice(0);
      queue.length = 0;
      copyQueue.forEach((job2) => {
        job2();
      });
      copyQueue.length = 0;
    });
  }
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
function createComponentInstance(n2) {
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
        if (handler) {
          let handlers = Array.isArray(handler) ? handler : [handler];
          handlers.forEach((handler2) => handler2(...args));
        }
      },
      slots: instance.slots,
      expose(exposed) {
        instance.exposed = exposed;
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

// packages/runtime-core/src/seq.ts
function getSequence(arr) {
  const result = [0];
  const len = arr.length;
  const p2 = arr.slice(0).fill(-1);
  let start;
  let end;
  let middle;
  for (let i2 = 0; i2 < len; i2++) {
    const arrI = arr[i2];
    if (arrI !== 0) {
      let resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        result.push(i2);
        p2[i2] = resultLastIndex;
        continue;
      }
      start = 0;
      end = result.length - 1;
      while (start < end) {
        middle = (start + end) / 2 | 0;
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      p2[i2] = result[start - 1];
      result[start] = i2;
    }
  }
  let i = result.length;
  let last = result[i - 1];
  while (i-- > 0) {
    result[i] = last;
    last = p2[last];
  }
  return result;
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
    let increasingNewIndexSequence = getSequence(newIndexToOldMapIndex);
    let j = increasingNewIndexSequence.length - 1;
    for (let i2 = toBePatched - 1; i2 >= 0; i2--) {
      const nextIndex = s2 + i2;
      const nextChild = c2[nextIndex];
      let anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null;
      if (newIndexToOldMapIndex[i2] == 0) {
        patch(null, nextChild, el, anchor);
      } else {
        if (i2 != increasingNewIndexSequence[j]) {
          hostInsert(nextChild.el, el, anchor);
          ;
        } else {
          j--;
        }
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
  function updateProps(prevProps, nextProps) {
    for (const key in nextProps) {
      prevProps[key] = nextProps[key];
    }
    for (const key in prevProps) {
      if (!(key in nextProps)) {
        delete prevProps[key];
      }
    }
  }
  function updatePreRender(instance, next) {
    instance.next = null;
    instance.vnode = next;
    updateProps(instance.props, next.props);
  }
  function setupRenderEffect(instance, el, anchor) {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        const subTree = instance.render.call(instance.proxy, instance.proxy);
        patch(null, subTree, el, anchor);
        instance.subTree = subTree;
        instance.isMounted = true;
      } else {
        const prevSubTree = instance.subTree;
        const next = instance.next;
        if (next) {
          updatePreRender(instance, next);
        }
        const nextSubTree = instance.render.call(
          instance.proxy,
          instance.proxy
        );
        instance.subTree = nextSubTree;
        patch(prevSubTree, nextSubTree, el, anchor);
      }
    };
    const effect2 = new ReactiveEffect(componentUpdateFn, () => {
      queueJob(instance.update);
    });
    const update = instance.update = effect2.run.bind(effect2);
    update();
  }
  function mountComponent(vnode, container, anchor) {
    const instance = vnode.component = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container, anchor);
  }
  const hasPropsChanged = (prevProps = {}, nextProps = {}) => {
    const nextKeys = Object.keys(nextProps);
    if (nextKeys.length !== Object.keys(prevProps).length) {
      return true;
    }
    for (let i = 0; i < nextKeys.length; i++) {
      const key = nextKeys[i];
      if (nextProps[key] !== prevProps[key]) {
        return true;
      }
    }
    return false;
  };
  function shouldComponentUpdate(n1, n2) {
    const oldProps = n1.props;
    const newProps = n2.props;
    if (oldProps == newProps)
      return false;
    return hasPropsChanged(oldProps, newProps);
  }
  const updateComponent = (n1, n2, el, anchor) => {
    const instance = n2.component = n1.component;
    if (shouldComponentUpdate(n1, n2)) {
      instance.next = n2;
      instance.update();
    }
  };
  const processComponent = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountComponent(n2, container, anchor);
    } else {
      updateComponent(n1, n2, container, anchor);
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
  createVNode,
  effect,
  h,
  isReactive,
  isRef,
  isSameVNodeType,
  isVNode,
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