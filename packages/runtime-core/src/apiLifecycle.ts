import { currentInstance, setCurrentInstance } from "./component";

export const enum LifecycleHooks {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u'
}
function createHook(type) {
  return (hook, target = currentInstance) => { // 调用的时候保存当前实例
    if (target) {
      const hooks = target[type] || (target[type] = []);
      const wrappedHook = () => {
        setCurrentInstance(target); // 当生命周期调用时 保证currentInstance是正确的
        hook.call(target);
        setCurrentInstance(null);
      }
      hooks.push(wrappedHook);
    }
  }
}
export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT);
export const onMounted = createHook(LifecycleHooks.MOUNTED);
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE);
export const onUpdated = createHook(LifecycleHooks.UPDATED);
