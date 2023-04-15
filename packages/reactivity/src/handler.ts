import { ReactiveFlags } from "./reactivity";

export const muableHandlers = {
  // receiver相当于代理对象
  get(target, key, receiver) {
    //取值的时候，让属性和effect产生关系
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }

    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    //设置的时候，让属性对应的effect执行
    Reflect.set(target, key, value, receiver)
    return true
  },
}