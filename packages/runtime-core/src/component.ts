import { proxyRefs, reactive } from "@vue/reactivity";
import { initProps } from "./componentProps";
import { hasOwn, isFunction, isObject } from "@vue/shared";
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
    render: null
  };
  return instance;
}



const publicPropertiesMap = {
  $attrs: (i) => i.attrs,
};
const PublicInstanceProxyHandlers = {
  get(target, key) {
    const { data, props } = target
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }
    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(target);
    }
  },
  set(target, key, value) {
    const { data, props } = target
    if (data && hasOwn(data, key)) {
      data[key] = value;
      return true;
    } else if (hasOwn(props, key)) {
      console.warn(`Attempting to mutate prop "${key as string}". Props are readonly.`);
      return false;
    }
    return true;
  }


}


export function setupComponent(instance) {
  const { props, type } = instance.vnode
  initProps(instance, props);
  instance.proxy = new Proxy(instance, PublicInstanceProxyHandlers)
  const data = type.data;
  if (data) {
    if (!isFunction(data))
      return console.warn("The data option must be a function.");
    instance.data = reactive(data.call(instance.proxy));
  }
  instance.render = type.render;
}
