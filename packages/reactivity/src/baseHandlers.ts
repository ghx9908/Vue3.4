import { isObject } from "@vue/shared";
import { ReactiveFlags, reactive } from "./reactivity";
import { track, trigger } from "./effect";
import { isRef } from "./ref";
export const muableHandlers: ProxyHandler<object> = {
  // receiver相当于代理对象
  get(target, key, receiver) {
    //取值的时候，让属性和effect产生关系
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }

    const res = Reflect.get(target, key, receiver);

    track(target, 'get', key);  // 依赖收集

    if (isRef(target[key])) {
      return target[key].value;
    }
    if (isObject(res)) {
      return reactive(res);
    }
    return res
  },
  set(target, key, value, receiver) {
    // 等会赋值的时候可以重新触发effect执行
    let oldValue = target[key]
    const result = Reflect.set(target, key, value, receiver);

    if (oldValue !== value) {
      trigger(target, 'set', key, value, oldValue)
    }

    return result;
  },
}

