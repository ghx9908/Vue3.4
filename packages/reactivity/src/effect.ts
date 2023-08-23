export let activeEffect = undefined;// 当前正在执行的effect 为了方便执行effect的时候依赖收集

export class ReactiveEffect {
  active = true;
  deps = []; // 收集effect中使用到的属性
  // 默认会将fn挂载到类的实例上
  parent = undefined;
  constructor(public fn) { }
  run() {
    try {
      if (!this.active) { // 不是激活状态
        return this.fn();
      }
      this.parent = activeEffect; // 当前的effect就是他的父亲
      activeEffect = this; // 设置成正在激活的是当前effect
      return this.fn();
    } finally {
      activeEffect = this.parent; // 执行完毕后还原activeEffect
      this.parent = undefined;
    }

  }
}

export function effect(fn) {
  // 创建一个响应式effect,并且让effect执行
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}
