import { activeEffect, trackEffect, triggerEffects } from "./effect"
import { createDep } from "./reactiveEffect"
import { toReactive } from "./reactivity"

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
  public __Is_Ref = true
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

function tarckRefEffect(ref) {


  if (activeEffect) {
    trackEffect(activeEffect, ref.dep = createDep(() => ref.dep = undefined, ref._value))
  }
}

function triggerRefEffect(ref) {
  const dep = ref.dep
  if (dep) {
    console.log('dep=>', dep)
    triggerEffects(dep)
  }
}
