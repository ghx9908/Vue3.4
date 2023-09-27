import { ShapeFlags, isString } from "@vue/shared";

export const Text = Symbol("Text");
export const Fragment = Symbol("Fragment");

export function isVNode(val) {
  return !!(val && val.__v_isVNode);
}


export function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
export function createVNode(type, props, children = null) {
  // React.createElement
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;
  const vnode = {
    shapeFlag,
    __v_isVNode: true,
    type,
    props,
    key: props && props.key,
    el: null, // 每个虚拟节点都对应一个真实节点，用来存放真实节点的后续更新的时候会产生新的虚拟节点，比较差异更新真实DOM
    children,
  };
  if (children) {
    let type = 0;
    if (Array.isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN;
    } else {
      type = ShapeFlags.TEXT_CHILDREN;
    }
    vnode.shapeFlag |= type;
  }
  return vnode;
}

// 创建元素的时候  createElement()  children.forEach(child=> createElement(child))
//  createElement()   createElement.innerHTML = children

// if(Array.isArray(children))

// 对象可能是组件  还有可能是其他类型
