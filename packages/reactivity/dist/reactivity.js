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

// packages/shared/src/index.ts
var isObject = (value) => {
  return value !== null && typeof value === "object";
};
var isFunction = (value) => {
  return typeof value === "function";
};

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
    trackEffect(activeEffect, ref2.dep = createDep(() => ref2.dep = void 0, ref2._value));
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
export {
  ReactiveEffect,
  activeEffect,
  computed,
  createReactiveObject,
  createRef,
  effect,
  isRef,
  proxyRefs,
  reactive,
  ref,
  shallowReactive,
  shallowRef,
  tarckRefEffect,
  toReactive,
  toRef,
  toRefs,
  trackEffect,
  triggerEffects,
  triggerRefEffect
};
//# sourceMappingURL=reactivity.js.map
