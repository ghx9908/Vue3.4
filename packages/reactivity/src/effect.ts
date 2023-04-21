export let activeEffect = undefined;// 当前正在执行的effect 为了方便执行effect的时候依赖收集

export class ReactiveEffect {
  // 默认会将fn挂载到类的实例上
  constructor(public fn) { }
  run() {
    try {
      activeEffect = this; // 设置成正在激活的是当前effect
      return this.fn();
    } finally {
      activeEffect = null
    }

  }
}

export function effect(fn) {
  // 创建一个响应式effect,并且让effect执行
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}
