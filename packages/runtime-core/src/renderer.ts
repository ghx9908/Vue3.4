import { ShapeFlags } from "@vue/shared";
import { isSameVNodeType } from "./createVNode";
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

  //删除老元素
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      // 递归调用patch方法 创建元素
      unmount(children[i]);
    }
  };
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

  const patchProps = (oldProps, newProps, el) => {
    for (let key in newProps) {
      // 用新的生效
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    // 老的里面有新的没有则删除
    for (let key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };


  const patchChildren = (n1, n2, el) => {
    // 比较前后2个节点的差异

    const c1 = n1 && n1.children // 老儿子
    let c2 = n2.children; // 新儿子

    let prevShapeFlag = n1.shapeFlag; // 上一次
    let shapeFlag = n2.shapeFlag; // 新的一次
    // 文本 数组 空 = 9种

    // 文本 -》 数组 文本删除掉，换成数组 v
    // （文本 -》 空  清空文本 ，  v
    // 文本 -》 文本 用新文本换老的文本 v

    //（数组 -》 文本  移除数组+更新文本  v
    // 数组 -》 空） 移除数组 v
    // 数组 -》 数组 （diff） ---

    // 空 -》 文本  更新文本 v
    // 空 -》 数组  挂载数组 v
    // （空中 -> 空  无需处理） v

    // 新的是文本   
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 新的是文本，老的是数组移除老的，换新的
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        // 新的是文本，老的是文本或者空 则直接采用新的
        // 文本有变换
        hostSetElementText(el, c2);
      }
    } else {
      // 新的是数组或者空
      // 旧得为数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 旧得为数组 新的为数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // diff算法
          // patchKeyedChildren(c1, c2, el);
        } else {
          //  旧的是数组， 新的空 卸载
          unmountChildren(c1);
        }
      } else {
        // 旧的为字符或者空  新的为数组或者空

        // 旧的的是文本  && 新的是数组或者空 移除旧的 挂在新的
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, "");
        }
        // 本次是数组 则直接挂载即可 
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  };


  // 核心的diff算法 vnode1旧的  vnode2新的
  const patchElement = (n1, n2) => {
    let el = (n2.el = n1.el);
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    patchProps(oldProps, newProps, el); // 比对新老属性
    patchChildren(n1, n2, el); // 比较元素的孩子节点
  }


  // 元素的渲染
  const patch = (n1, n2, container) => {
    // 初始化和diff算法都在这里喲
    if (n1 == n2) {
      return
    }
    // 两个不同虚拟节点不需要进行比较，直接移除老节点，将新的虚拟节点渲染成真实DOM进行挂载即可
    if (n1 && !isSameVNodeType(n1, n2)) { // 有n1 是n1和n2不是同一个节点
      unmount(n1)
      n1 = null
    }

    if (n1 == null) { // 初始化的情况
      mountElement(n2, container);
    } else {
      // diff算法
      patchElement(n1, n2); // 比较两个元素
    }
  }

  const unmount = (vnode) => { hostRemove(vnode.el) }

  const render = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode); // 找到对应的真实节点将其卸载
      } // 卸载
    } else {
      patch(container._vnode || null, vnode, container); // 初始化和更新
    }
    container._vnode = vnode;
  }
  return {
    render
  }
}

// 卸载
// createRenderer(renderOptions).render(null,document.getElementById('app'));



