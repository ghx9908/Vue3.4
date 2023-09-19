import { ShapeFlags } from "@vue/shared";

export function createRenderer(options) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
  } = options

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], container);
    }
  }
  const mountElement = (vnode, container) => {
    const { type, props, shapeFlag } = vnode
    let el = vnode.el = hostCreateElement(type); // 创建真实元素，挂载到虚拟节点上
    if (props) { // 处理属性
      for (const key in props) { // 更新元素属性
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) { // 文本
      hostSetElementText(el, vnode.children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) { // 多个儿子
      mountChildren(vnode.children, el);
    }
    hostInsert(el, container); // 插入到容器中
  }

  const patch = (n1, n2, container) => {
    // 初始化和diff算法都在这里喲
    if (n1 == n2) {
      return
    }
    if (n1 == null) { // 初始化的情况
      mountElement(n2, container);
    } else {
      // diff算法
    }
  }
  const render = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) { } // 卸载
    } else {
      patch(container._vnode || null, vnode, container); // 初始化和更新
    }
    container._vnode = vnode;
  }
  return {
    render
  }
}
