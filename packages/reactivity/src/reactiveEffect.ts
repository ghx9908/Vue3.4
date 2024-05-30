import { activeEffect, trackEffect, triggerEffects } from "./effect"


export const targetMap = new WeakMap()

export function createDep(cleanup, key) {

  const deps = new Map() as any
  deps.cleanup = cleanup
  deps.key = key

  return deps

}
export function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }

    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = createDep(() => dep.delete(key), key)))
    }
    trackEffect(activeEffect, dep)
    // console.log('targetMap=>', targetMap)
  }
}


export function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const dep = depsMap.get(key)

  if (dep) {
    triggerEffects(dep);
  }
}
