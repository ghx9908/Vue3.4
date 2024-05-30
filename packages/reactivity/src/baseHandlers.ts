
import { isObject } from "@vue/shared"
import { track, trigger } from "./reactiveEffect"
import { reactive } from "./reactivity"

export const enum ReactiveFlags { // 对象
  IS_REACTIVE = "__v_isReactive",
}
export const mutanleHandler: ProxyHandler<Record<any, any>> = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) return true
    track(target, key)


    const res = Reflect.get(target, key, receiver)
    if (isObject(res)) {
      return reactive(res)
    }
    return res
  },
  set(target, key, value, receiver) {

    const oldValue = target.key
    const result = Reflect.set(target, key, value, receiver)
    if (oldValue !== value) {
      trigger(target, key, value, oldValue)
    }
    return result
  }
}
