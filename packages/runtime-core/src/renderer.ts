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

  // 第一次挂载
  /**
   * 
   * @param children [vnode1.vnode2]
   * @param container 容器 真实dom
   */
  function mountChildren(children, container) {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], container);
    }

  }

  function mountElement(vnode, container) {
    const { type, props, shapeFlag } = vnode
    let el = vnode.el = hostCreateElement(type)

    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) { // 文本
      hostSetElementText(el, vnode.children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) { // 多个儿子
      mountChildren(vnode.children, el);
    }
    hostInsert(el, container); // 插入到容器中

  }

  /**
   * 
   * @param n1 老的vnode
   * @param n2 新的vnode
   * @param container 容器
   */
  function patch(n1, n2, container) {
    if (n1 == n2) {
      return
    }
    if (n1 == null) {
      // 挂着
      mountElement(n2, container)

    } else {
      //diff
    }

  }

  function unmount(vnode) {
    hostRemove(vnode.el)
  }

  const render = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        //卸载
        unmount(container._vnode)
      }
    } else {
      //初次挂载或者更新
      patch(container._vnode || null, vnode, container)
    }
    container._vnode = vnode;

  }

  return {
    render
  }

}
