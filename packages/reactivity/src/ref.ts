import { isObject } from "@vue/shared";
import { trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactivity";

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

