
import { DirtyLevels } from './constants'

export let activeEffect

export function effect(fn, option?) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run()
  })
  _effect.run()
  if (option) {
    Object.assign(_effect, option)
  }

  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner
}

function preCleanupEffect(effect) {
  effect._trackId++;
  effect._depsLength = 0

}

function cleanupDepEffect(dep, effect) {
  dep.delete(effect);
  if (dep.size === 0) {
    dep.cleanup(); // 清理此属性
  }
}

function postCleanupEffect(effect) {
  // 重新做收集后，看依赖列表有没有增加，有增加就要删除 （map是不能添加重复的）
  if (effect.deps.length > effect._depsLength) {
    // 仅处理多出来的删除即可
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanupDepEffect(effect.deps[i], effect);
    }
    effect.deps.length = effect._depsLength;
  }
}



export class ReactiveEffect {
  active = true
  deps = []
  _trackId = 0
  _depsLength = 0
  _running = 0
  _dirtyLevel = DirtyLevels.Dirty;
  // scheduler 如果fn中以来的数据发生变化，则重新执行run 方法
  constructor(public fn, public scheduler) {
  }

  public get dirty() {
    return this._dirtyLevel === DirtyLevels.Dirty;
  }

  public set dirty(val) {
    this._dirtyLevel = val ? DirtyLevels.Dirty : DirtyLevels.NotDirty;
  }


  run() {
    this._dirtyLevel = DirtyLevels.NotDirty; // 运行一次后，脏值变为不脏
    if (!this.active) {
      return this.fn()
    }
    let lastEffect = activeEffect
    try {
      activeEffect = this
      this._running++
      preCleanupEffect(this); // 每次渲染前重新进行依赖收集
      return this.fn()
    } finally {
      this._running--
      postCleanupEffect(this); // 清理依赖
      activeEffect = lastEffect

    }
  }
}

export function trackEffect(effect, dep) {
  // 属性记住effect
  // dep.set(effect, effect._trackId)
  // effect.deps[effect._depsLength++] = dep

  // {flag, name} 1
  // {flag, age}  2

  if (dep.get(effect) !== effect._trackId) {
    dep.set(effect, effect._trackId)
    const oldDep = effect.deps[effect._depsLength]
    if (oldDep !== dep) {

      if (oldDep) {
        cleanupDepEffect(oldDep, effect);
      }
      effect.deps[effect._depsLength++] = dep;
    } else {
      effect._depsLength++
    }
  }
}




export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    if (effect._dirtyLevel < DirtyLevels.Dirty) {
      effect._dirtyLevel = DirtyLevels.Dirty;
      // 需要差异化开，计算属性只需要修改dirty
      // effect.trigger();
    }
    if (effect._running === 0) {
      if (effect.scheduler) {
        effect.scheduler();
      }
    }
  }
}
