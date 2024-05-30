

export let activeEffect

export function effect(fn, option?) {

  const _effect = new ReactiveEffect(fn, () => {
    _effect.run()
  })
  _effect.run()

  return _effect
}


class ReactiveEffect {
  active = true
  deps = []
  _trackId = 0
  _depsLength = 0
  // scheduler 如果fn中以来的数据发生变化，则重新执行run 方法
  constructor(public fn, public scheduler) {
  }
  run() {
    if (!this.active) {
      return this.fn()
    }
    let lastEffect = activeEffect
    try {
      activeEffect = this

      this.fn()
    } finally {
      activeEffect = lastEffect
    }
  }
}

export function trackEffect(effect, dep) {
  // 属性记住effect
  dep.set(effect, effect._trackId)
  effect.deps[effect._depsLength++] = dep
}



export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    if (effect.scheduler) {
      effect.scheduler();
    }
  }
}
