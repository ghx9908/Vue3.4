
import { track, trigger } from "./reactiveEffect"

export const enum ReactiveFlags { // 对象
  IS_REACTIVE = "__v_isReactive",
}


export const mutanleHandler: ProxyHandler<Record<any, any>> = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) return true
    track(target, key)

    return Reflect.get(target, key, receiver)
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
