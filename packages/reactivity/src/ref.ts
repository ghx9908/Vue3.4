import { activeEffect, trackEffect, triggerEffects } from "./effect"
import { createDep } from "./reactiveEffect"
import { toReactive } from "./reactivity"


export function isRef(value) {
  return !!(value && value.__v_isRef);
}

export function ref(value: any) {
  return createRef(value, false)
}

export function shallowRef(value) {
  return createRef(value, true)
}

export function createRef(rawValue, shallow) {
  return new RefImpl(rawValue, shallow)
}


class RefImpl {
  public _value
  public __v_isRef = true
  public dep

  constructor(public rawValue, public _shallow) {
    this._value = _shallow ? rawValue : toReactive(rawValue)
  }

  get value() {
    tarckRefEffect(this)
    return this._value
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this._value = this._shallow ? newValue : toReactive(newValue)
      this.rawValue = newValue
      triggerRefEffect(this)
    }
  }
}

export function tarckRefEffect(ref) {
  if (activeEffect) {
    trackEffect(activeEffect, ref.dep = ref.dep || createDep(() => ref.dep = undefined, ref._value))
  }
}

export function triggerRefEffect(ref) {
  const dep = ref.dep
  if (dep) {
    triggerEffects(dep)
  }
}



class ObjectRefImpl {
  public __v_isRef = true
  constructor(public _object, public _key) {

  }

  get value() {
    return this._object[this._key]
  }

  set value(newValue) {
    this._object[this._key] = newValue
  }
}


export function toRef(object, key) {
  return new ObjectRefImpl(object, key)
}

export function toRefs(object, key) {
  const ret = Array.isArray(object) ? new Array(object.length) : {}
  for (let key in object) {
    ret[key] = new ObjectRefImpl(object, key)
  }
  return ret
}

export function proxyRefs(objectWithRefs) {
  // 代理的思想，如果是ref 则取ref.value
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      let v = Reflect.get(target, key, receiver);
      return v.__v_isRef ? v.value : v;
    },
    set(target, key, value, receiver) {
      // 设置的时候如果是ref,则给ref.value赋值
      const oldValue = target[key];
      if (oldValue.__v_isRef) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    },
  });
}
