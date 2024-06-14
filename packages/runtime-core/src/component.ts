import { proxyRefs, reactive } from "@vue/reactivity";
import { initProps } from "./componentProps";
import { ShapeFlags, hasOwn, isFunction, isObject } from "@vue/shared";
export let currentInstance = null;
export const setCurrentInstance = (instance) => (currentInstance = instance);
export const getCurrentInstance = () => currentInstance;
export const unsetCurrentInstance = () => (currentInstance = null);
export function createComponentInstance(vnode) {
  const instance = {
    data: null, // 组件的状态
    vnode: vnode,
    isMounted: false, // 组件是否挂载
    subTree: null, // 子树
    update: null,
    propsOptions: vnode.type.props,
    attrs: {},
    props: {},
    component: null,
    proxy: null,
    render: null,
    setupState: {},
    slots: null, // 初始化插槽属性
  };
  return instance;
}

const publicPropertiesMap = {
  $attrs: (i) => i.attrs,
  $slots: (i) => i.slots,
};
const PublicInstanceProxyHandlers = {
  get(target, key) {
    const { data, props, setupState } = target
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    } else if (setupState && hasOwn(setupState, key)) {
      // setup返回值做代理
      return setupState[key];
    }

    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(target);
    }
  },
  set(target, key, value) {
    const { data, setupState, props } = target
    if (data && hasOwn(data, key)) {
      data[key] = value;
      return true;
    } else if (hasOwn(props, key)) {
      console.warn(`Attempting to mutate prop "${key as string}". Props are readonly.`);
      return false;
    } else if (setupState && hasOwn(setupState, key)) {
      // setup返回值做代理
      setupState[key] = value;
    }
    return true;
  }
}
function initSlots(instance, children) {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children;
  } else {
    instance.slots = {};
  }
}


export function setupComponent(instance) {
  const { props, type, children } = instance.vnode
  initProps(instance, props);
  initSlots(instance, children); // 初始化插槽
  if (!instance.render) {
    instance.render = type.render;
  }

  let { setup } = type;
  if (setup) {
    // 对setup做相应处理
    const setupContext = {
      attrs: instance.attrs,
      emit: (event, ...args) => {
        const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
        const handler = instance.vnode.props[eventName]; // 找到绑定的方法
        // 触发方法执行
        handler && handler(...args);
      },
    };

    setCurrentInstance(instance); // 在调用setup的时候保存当前实例
    const setupResult = setup(instance.props, setupContext);
    unsetCurrentInstance();
    if (isFunction(setupResult)) {
      instance.render = setupResult;
    } else if (isObject(setupResult)) {
      instance.setupState = proxyRefs(setupResult); // 这里对返回值进行结构
    }
  }



  instance.proxy = new Proxy(instance, PublicInstanceProxyHandlers)
  const data = type.data;
  if (data) {
    if (!isFunction(data))
      return console.warn("The data option must be a function.");
    instance.data = reactive(data.call(instance.proxy));
  }
}
