// packages/reactivity/src/effect.ts
var activeEffect = void 0;
var ReactiveEffect = class {
  constructor(fn) {
    this.fn = fn;
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
      return this.fn();
    } finally {
      activeEffect = this.parent;
      this.parent = void 0;
    }
  }
};
function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}

// packages/shared/src/index.ts
var isObject = (value) => {
  return value !== null && typeof value === "object";
};

// packages/reactivity/src/baseHandlers.ts
var muableHandlers = {
  get(target, key, receiver) {
    if (key === "__v_isReactive" /* IS_REACTIVE */) {
      return true;
    }
    const res = Reflect.get(target, key, receiver);
    track(target, "get", key);
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
    let shouldTrack = !dep.has(activeEffect);
    if (shouldTrack) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
    }
  }
}
function trigger(target, type, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const effects = depsMap.get(key);
  effects && effects.forEach((effect2) => {
    effect2.run();
  });
}

// packages/reactivity/src/reactivity.ts
var ReactiveFlags = /* @__PURE__ */ ((ReactiveFlags2) => {
  ReactiveFlags2["IS_REACTIVE"] = "__v_isReactive";
  return ReactiveFlags2;
})(ReactiveFlags || {});
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
export {
  ReactiveEffect,
  ReactiveFlags,
  activeEffect,
  effect,
  reactive
};
//# sourceMappingURL=reactivity.js.map
