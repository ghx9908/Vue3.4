import { isObject } from "@vue/shared"
import { mutanleHandler } from "./baseHandlers"
import { ReactiveFlags } from "./constants"



export function toReactive(object) {
  return isObject(object) ? reactive(object) : object
}

const reactiveMap = new WeakMap()
export function reactive(target: object) {
  return createReactiveObject(target, false)
}


export function shallowReactive(target) {
  return createReactiveObject(target, true)
}

export function createReactiveObject(target: object, isReadonly: boolean) {

  if (target[ReactiveFlags.IS_REACTIVE]) return target

  if (!isObject(target)) return target
  // 缓存
  const exisitingProxy = reactiveMap.get(target);
  if (exisitingProxy) return exisitingProxy
  const proxy = new Proxy(target, mutanleHandler)
  reactiveMap.set(target, proxy)
  return proxy
}



export function isReactive(value) {

  return value && value[ReactiveFlags.IS_REACTIVE]
}
