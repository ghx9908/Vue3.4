import { isFunction } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { tarckRefEffect, triggerRefEffect } from "./ref";


class ComputedRefImpl {
  public _value;
  public effect;
  public dep;

  constructor(public getter, public setter) {
    this.effect = new ReactiveEffect(getter, () => triggerRefEffect(this))// 计算属性依赖的值变化后会触发此函数)
  }


  get value() {
    if (this.effect.dirty) {
      this._value = this.effect.run()
      tarckRefEffect(this); // 取值时进行依赖收集
    }
    return this._value;
  }
  set value(newValue) {
    this.setter(newValue)
  }

}

export function computed(getterOrOptions) {
  let getter;
  let setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
    setter = () => { }
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }


  return new ComputedRefImpl(getter, setter)

}
