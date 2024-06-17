import { hasOwn, invokeArrayFns, ShapeFlags } from "@vue/shared"
import { Fragment, isSameVNodeType, Text } from "./createVNode"
import { getSequence } from "./seq"
import { reactive, ReactiveEffect } from "@vue/reactivity"
import { queueJob } from "./scheduler"
import { initProps } from "./componentProps"
import { createComponentInstance, setupComponent } from "./component"
import { hasPropsChanged, updateProps } from "./props"

export function renderComponentRoot(instance) {
  let { render, proxy, vnode, props } = instance;
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    return render.call(proxy, proxy);
  } else {
    return vnode.type(props); // 函数式组件直接调用即可
  }
}
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
  function mountChildren(children, container, anchor, parentComponent) {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], container, anchor, parentComponent)
    }
  }

  function mountElement(vnode, container, anchor, parentComponent) {
    const { type, props, shapeFlag } = vnode
    let el = (vnode.el = hostCreateElement(type))

    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 文本
      hostSetElementText(el, vnode.children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 多个儿子
      mountChildren(vnode.children, el, null, parentComponent)
    }
    hostInsert(el, container, anchor) // 插入到容器中
  }

  function patchProps(oldProps, newProps, el) {
    for (let key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key])
    }
    // 删除多余的属性
    for (let key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], newProps[key])
      }
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }


  /**
   * 
   * @param c1  VNode1 Childen Arr 旧的
   * @param c2 VNode2 Childen Arr 新的
   * @param container 旧的对应的真是dom
   */
  function patchKeyedChildren(c1, c2, container) {
    let i = 0
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    // 1. sync from start
    // (a b) c
    // (a b) d e
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container)
      } else {
        break
      }
      i++
    }
    // i=2
    // 2. sync from end
    // a (b c)
    // d e (b c)
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container)
      } else {
        break
      }
      e1--
      e2--
    }
    // el = 5 e2 =5 i=2

    // 3. common sequence + mount
    // (a b)
    // (a b) c
    // i = 2, e1 = 1, e2 = 2
    // (a b)
    // c (a b)
    // i = 0, e1 = -1, e2 = 0

    if (i > e1 && i <= e2) {
      const anchor = c2[e2 + 1]?.el;// 下一个元素
      while (i <= e2) {
        patch(null, c2[i], container, anchor)
        i++
      }
    }

    // 4. common sequence + unmount
    // (a b) c
    // (a b)
    // i = 2, e1 = 2, e2 = 1
    // a (b c)
    // (b c)
    // i = 0, e1 = 0, e2 = -1
    else if (i > e2 && i <= e1) {
      while (i <= e1) {
        unmount(c1[i])
        i++
      }

    }
    // 5. unknown sequence
    // [i ... e1 + 1]: a b [c d e] f g
    // [i ... e2 + 1]: a b [e d c h] f g
    // i = 2, e1 = 4, e2 = 5

    else {
      const s1 = i // prev starting index
      const s2 = i // next starting index
      // 5.1 将新的元素做成一个映射表 <newIndex key, newIndex>
      const keyToNewIndexMap = new Map();
      for (i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        // 第几个 并不是index
        keyToNewIndexMap.set(nextChild.key, i); // 不写key就是undefined
      }
      // 5.2 循环遍历待修补的旧子节点，并尝试修补匹配节点并删除不再存在的节点
      const toBePatched = e2 - s2 + 1 // 待修补的节点个数 
      const newIndexToOldIndexMap = new Array(toBePatched)// 映射表
      // oldIndex = 0是一个特殊值，表示新节点没有对应的旧节点
      for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0

      for (i = s1; i <= e1; i++) {
        const prevChild = c1[i]
        let newIndex = keyToNewIndexMap.get(prevChild.key)// 获取新节点中key对应的索引
        if (newIndex === undefined) {// 新的里面不存在 删除
          unmount(prevChild)
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1// 更新映射表  新索引-s2 对应的是旧索引+1
          patch(prevChild, c2[newIndex], container);
        }
      }
      //  5.3 move and mount 移动和挂载
      let increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
      let j = increasingNewIndexSequence.length - 1; // 取出最后一个人的索引
      for (i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i; //[ecdh]   找到h的索引
        const nextChild = c2[nextIndex]
        let anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null; // 找到当前元素的下一个元素
        if (newIndexToOldIndexMap[i] == 0) {
          // 这是一个新元素 直接创建插入到 当前元素的下一个即可
          patch(null, nextChild, container, anchor);
        } else {

          if (i != increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, container, anchor);//操作当前的d 以d下一个作为参照物插入
          } else {
            j--;
          }

        }
      }

    }
  }
  const patchChildren = (n1, n2, el, anchor, parentComponent) => {
    let c1 = n1 && n1.children
    let c2 = n2.children
    let prevShapeFlag = n1.shapeFlag
    let shapeFlag = n2.shapeFlag
    // 新的是文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {// 老的是数组
        unmountChildren(c1)
      }
      if (c1 !== c2) {
        hostSetElementText(el, c2);// 设置文本
      }
    } else {
      // 新的为空或者 数组

      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 核心diff
          patchKeyedChildren(c1, c2, el)
        } else {
          unmountChildren(c1)
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, "");
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el, anchor, parentComponent);
        }
      }
    }

  }
  // 核心的diff算法 vnode1旧的  vnode2新的
  function patchElement(n1, n2, anchor, parentComponent) {
    let el = (n2.el = n1.el)
    const oldProps = n1.props || {}
    const newProps = n2.props || {}

    patchProps(oldProps, newProps, el) // 比对新老属性
    patchChildren(n1, n2, el, anchor, parentComponent)
  }

  function processElement(n1, n2, container, anchor, parentComponent) {
    if (n1 == null) {
      // 挂载
      mountElement(n2, container, anchor, parentComponent)
    } else {
      //diff
      patchElement(n1, n2, anchor, parentComponent) // 比较两个元素(n1, n2, container);
    }
  }

  const processText = (n1, n2, container) => {
    if (n1 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    } else {
      const el = (n2.el = n1.el);
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children);
      }
    }
  };

  const processFragment = (n1, n2, container, parentComponent) => {
    if (n1 == null) {
      mountChildren(n2.children, container, null, parentComponent);
    } else {
      patchChildren(n1, n2, container, null, parentComponent);
    }
  };
  const updateComponentPreRender = (instance, next) => {
    instance.next = null;
    instance.vnode = next;
    Object.assign(instance.slots, next.children); // 渲染前要更新插槽
    updateProps(instance, instance.props, next.props);
  }




  const setupRenderEffect = (instance, container, anchor, parentComponentr) => {

    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        const { bm, m } = instance;
        if (bm) {
          // beforeMount
          invokeArrayFns(bm);
        }
        const subTree = renderComponentRoot(instance);
        patch(null, subTree, container, anchor, instance)
        instance.subTree = subTree
        instance.isMounted = true
        if (m) {
          // mounted
          invokeArrayFns(m);
        }
      } else {
        let { next, bu, u } = instance;
        if (next) {
          updateComponentPreRender(instance, next);
        }
        if (bu) {
          // beforeUpdate
          invokeArrayFns(bu);
        }
        const subTree = renderComponentRoot(instance);
        patch(instance.subTree, subTree, container, anchor, instance)
        instance.subTree = subTree
        if (u) {
          // updated
          invokeArrayFns(u);
        }

      }
    }

    const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(instance.update));
    const update = (instance.update = () => effect.run())
    update()

  }

  const mountComponent = (vnode, container, anchor, parentComponent) => {
    // 1) 创建实例
    const instance = (vnode.component = createComponentInstance(vnode, parentComponent));
    // 2) 给实例赋值
    setupComponent(instance);
    // 3) 创建渲染effect及更新
    setupRenderEffect(instance, container, anchor, parentComponent);
  }



  const shouldUpdateComponent = (n1, n2) => {
    const { props: prevProps, children: prevChildren } = n1;
    const { props: nextProps, children: nextChildren } = n2;
    if (prevChildren || nextChildren) return true;

    if (prevProps === nextProps) return false;
    return hasPropsChanged(prevProps, nextProps);


  }


  const updateComponent = (n1, n2) => {
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2; // 将新的虚拟节点放到next属性上
      instance.update(); // 属性变化手动调用更新方法
    }

  }
  const processComponent = (n1, n2, container, anchor, parentComponent) => {
    if (n1 == null) {
      mountComponent(n2, container, anchor, parentComponent);
    } else {
      // 组件更新逻辑
      // 组件更新逻辑
      updateComponent(n1, n2);
    }
  }


  /**
   *
   * @param n1 老的vnode
   * @param n2 新的vnode
   * @param container 容器
   */
  function patch(n1, n2, container, anchor = null, parentComponent = null) {
    if (n1 == n2) {
      return
    }
    if (n1 && !isSameVNodeType(n1, n2)) {
      // 有n1 是n1和n2不是同一个节点
      unmount(n1)
      n1 = null
    }
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container); // 处理文本
        break;
      case Fragment:
        processFragment(n1, n2, container, parentComponent); // 处理fragment
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor, parentComponent); // 之前处理元素的逻辑
        }
        else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor, parentComponent);
        }
    }
  }

  function unmount(vnode) {
    const { shapeFlag } = vnode;
    if (vnode.type === Fragment) {
      return unmountChildren(vnode.children);
    } else if (shapeFlag & ShapeFlags.COMPONENT) {
      // 组件那么移除
      return unmount(vnode.component.subTree); // 移除组件
    }

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
    container._vnode = vnode
  }

  return {
    render,
  }
}
