
export class ReactiveEffect {
  // 默认会将fn挂载到类的实例上
  constructor(public fn) { }
  run() {
    return this.fn();
  }
}

export function effect(fn) {
  // 创建一个响应式effect,并且让effect执行
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}
