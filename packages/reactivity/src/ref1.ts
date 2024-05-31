import { isObject } from "@vue/shared";
import { trackEffects, triggerEffects } from "./effect1";
import { reactive } from "./reactivity1";

export function isRef(value) {
  return !!(value && value.__v_isRef);
}

export function toReactive(value,) {
  return isObject(value) ? reactive(value) : value;
}
// ref 处理的是基本类型

class RefImpl {
  public _value;
  public dep = new Set();
  public __v_isRef = true;
  constructor(public rawValue, public _shallow) {
    this._value = _shallow ? rawValue : toReactive(rawValue); // 浅ref不需要再次代理
  }
  get value() {
    trackEffects(this.dep);
    return this._value;
  }
  set value(newVal) {
    if (newVal !== this.rawValue) {
      this.rawValue = newVal;
      this._value = this._shallow ? newVal : toReactive(newVal);
      triggerEffects(this.dep);
    }
  }
}
function createRef(rawValue, shallow) {
  return new RefImpl(rawValue, shallow); // 将值进行装包
}


// 将原始类型包装成对象, 同时也可以包装对象 进行深层代理
export function ref(value) {
  return createRef(value, false);
}

// 创建浅ref 不会进行深层代理
export function shallowRef(value) {
  return createRef(value, true);
}



class ObjectRefImpl {
  public __v_isRef = true
  constructor(public _object, public _key) { }
  get value() {
    return this._object[this._key];
  }
  set value(newVal) {
    this._object[this._key] = newVal;
  }
}
export function toRef(object, key) { // 将响应式对象中的某个属性转化成ref
  return new ObjectRefImpl(object, key);
}



export function toRefs(object) { // 将所有的属性转换成ref
  const ret = Array.isArray(object) ? new Array(object.length) : {};
  for (const key in object) {
    ret[key] = toRef(object, key);
  }
  return ret;
}


export function proxyRefs(objectWithRefs) { // 代理的思想，如果是ref 则取ref.value
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      let v = Reflect.get(target, key, receiver);
      return v.__v_isRef ? v.value : v;
    },
    set(target, key, value, receiver) { // 设置的时候如果是ref,则给ref.value赋值
      const oldValue = target[key];
      if (oldValue.__v_isRef) {
        oldValue.value = value;
        return true
      } else {
        return Reflect.set(target, key, value, receiver)
      }
    }
  })
}
