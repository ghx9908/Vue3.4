import { ShapeFlags, isObject, isString } from "@vue/shared";

export const Text = Symbol("Text");
export const Fragment = Symbol("Fragment");

export function isVNode(value) {
  return value.__v_isVNode === true
}

export function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key == n2.key
}
export function createVNode(type, props, children = null) {
  // 判断type是否为字符串，如果是，则shapeFlag为元素标志
  const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : 0;
  // 创建vnode对象
  const vnode = {
    // 标记为虚拟节点
    __v_isVNode: true,
    // 节点类型
    type,
    // 节点属性
    props,
    // 节点的key值
    key: props && props['key'],
    // 节点的元素
    el: null,
    // 子节点
    children,
    // 节点形状标志
    shapeFlag
  }
  // 如果有子节点
  if (children) {
    // 定义type变量
    let type = 0;
    // 如果子节点为数组
    if (Array.isArray(children)) {
      // 设置type为数组子节点标志
      type = ShapeFlags.ARRAY_CHILDREN;
      // 如果子节点不是数组
    } else {
      // 将子节点转换为字符串
      children = String(children);
      // 设置type为文本子节点标志
      type = ShapeFlags.TEXT_CHILDREN
    }
    // 将type与vnode的shapeFlag进行或运算
    vnode.shapeFlag |= type
  }
  // 返回创建的虚拟节点
  return vnode
}
// 如果shapeFlag为9 说明元素中包含一个文本
// 如果shapeFlag为17 说明元素中有多个子节点

