import { isFunction } from "@vue/shared";
import { activeEffect, ReactiveEffect, trackEffects, triggerEffects } from "./effect";


class ComputedRefImpl {
  public effect;
  public _value;
  public dep;
  public _dirty = true; // 做缓存
  public __v_isRef = true; // 表示后续我们可以增加拆包的逻辑
  constructor(getter, public setter) {
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) { // 依赖的值变化更新dirty并触发更新
        this._dirty = true;
        triggerEffects(this.dep)
      }
    });
  }
  get value() { // 取值的时候进行依赖收集
    if (activeEffect) {
      trackEffects(this.dep || (this.dep = new Set));
    }
    if (this._dirty) { // 如果是脏值, 执行getter函数
      this._dirty = false;
      this._value = this.effect.run();// this._value就是取值后的结果
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

  const isGetter = isFunction(getterOrOptions);// 传入的是函数就是getter
  if (isGetter) {
    getter = getterOrOptions;
    setter = () => {
      console.log("warn");
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  // 创建计算属性
  return new ComputedRefImpl(getter, setter);
}
