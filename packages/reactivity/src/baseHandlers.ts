import { activeEffect } from "./effect";
import { ReactiveFlags } from "./reactivity";

export const muableHandlers: ProxyHandler<object> = {
  // receiver相当于代理对象
  get(target, key, receiver) {
    //取值的时候，让属性和effect产生关系
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    const res = Reflect.get(target, key, receiver);

    track(target, 'get', key);  // 依赖收集
    return res
  },
  set(target, key, value, receiver) {
    // 等会赋值的时候可以重新触发effect执行
    let oldValue = target[key]
    const result = Reflect.set(target, key, value, receiver);

    if (oldValue !== value) {
      trigger(target, 'set', key, value, oldValue)
    }

    return result;
  },
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
        effect.run();
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
