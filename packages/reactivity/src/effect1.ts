export let activeEffect = undefined;// 当前正在执行的effect 为了方便执行effect的时候依赖收集

function cleanupEffect(effect) {
  const { deps } = effect; // 清理effect  effect.deps = [newSet(),newSet(),newSet()]
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect);
  }
  effect.deps.length = 0;
}

export class ReactiveEffect {
  active = true;
  deps = []; // 收集effect中使用到的属性
  // 默认会将fn挂载到类的实例上
  parent = undefined;
  constructor(public fn, public scheduler?) { }
  run() {
    try {
      if (!this.active) { // 不是激活状态
        return this.fn();
      }
      this.parent = activeEffect; // 当前的effect就是他的父亲
      activeEffect = this; // 设置成正在激活的是当前effect
      cleanupEffect(this);//清理副作用
      return this.fn();
    } finally {
      activeEffect = this.parent; // 执行完毕后还原activeEffect
      this.parent = undefined;
    }
  }
  stop() {// 停止依赖收集
    if (this.active) {
      cleanupEffect(this);
      this.active = false
    }
  }
}

export function effect(fn, options: any = {}) {
  // 创建一个响应式effect,并且让effect执行
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();

  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner; // 返回runner
}



// 进行依赖收集   targetMap 记录响应式对象 属性依赖的effect  每个effect记录依赖的
//                                               [targetMap]      [depsMap]            depSet
const targetMap = new WeakMap(); // 记录依赖关系  :{ reactiveObj1 : { reactiveObj1的属性： [ effect1...]   }  }
export function track(target, type, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target); // {对象：map}
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))// 初始化depsMap
    }
    let dep = depsMap.get(key); // 获取该属性被哪些effect收集  第一次为false
    if (!dep) {
      depsMap.set(key, (dep = new Set())) // 初始化该属性的依赖effect {对象：{ 属性 :[ dep, dep ]}}
    }
    trackEffects(dep); // 收集set中

  }
}


export function trigger(target, type, key?, newValue?, oldValue?) {
  const depsMap = targetMap.get(target); // 获取对应的映射表 {属性1：[effect1..],属性2:[effect2...] }
  if (!depsMap) { //没有被收集过直接返回
    return
  }
  const effects = depsMap.get(key); // 查看该属性有没有被effect收集 | 查看该属性收集的effect
  triggerEffects(effects);
}



export function triggerEffects(effects) {
  if (effects) {
    effects = [...effects]; // vue2中的是数组，先拷贝在魂环
    effects.forEach((effect) => {
      // 当前正在执行的和现在要执行的是同一个我就屏蔽掉
      if (activeEffect !== effect) {
        if (effect.scheduler) { // 如果有调度函数则执行调度函数
          effect.scheduler()
        } else {
          effect.run();
        }
      }
    });
  }
}


export function trackEffects(dep) {
  let shouldTrack = !dep.has(activeEffect) //看是否应该被收集
  if (shouldTrack) {
    dep.add(activeEffect); // 把当前活跃的efftct添加到属性的set种
    activeEffect.deps.push(dep); //  activeEffect收集依赖属性所有的 Set([effect1...]) ，这样后续可以用于清理
  }
}


