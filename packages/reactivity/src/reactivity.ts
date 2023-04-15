import { isObject } from "@vue/shared";
import { muableHandlers } from "./handler";

export const enum ReactiveFlags { // 对象
  IS_REACTIVE = "__v_isReactive",
}
const reactiveMap = new WeakMap()
export function reactive(target) {
  // reactive 只能处理对象类型的数据，不是对象不处理
  if (!isObject(target)) return target

  // 缓存可以采用映射表 {{target} -> proxy}
  let existingProxy = reactiveMap.get(target)// 看一下这个对象是否有被代理过
  if (existingProxy) return existingProxy// 代理过直接返回

  //防止对象重复被代理
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }

  const proxy = new Proxy(target, muableHandlers)// 没有代理过创建代理
  reactiveMap.set(target, proxy) // 缓存代理结果

  // 1） 在vue3.0的时候 会创造一个反向映射表 {代理的结果 -》 原内容}
  // 2) 目前不用创建反向映射表，用的方式是，如果这个对象被代理过了说明已经被proxy拦截过了
  return proxy
}
