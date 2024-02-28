import { NodeTypes } from "./ast";

import { TO_DISPLAY_STRING, createCallExpression, createVNodeCall, createObjectExpression, CREATE_ELEMENT_VNODE } from "./runtimeHelpers";
export const FRAGMENT = Symbol("FRAGMENT");
export const CREATE_ELEMENT_BLOCK = Symbol(`createElementBlock`)
export const OPEN_BLOCK = Symbol(`openBlock`)
export const helperNameMap = {
  [FRAGMENT]: "Fragment",
  [OPEN_BLOCK]: `openBlock`,  // block处理
  [CREATE_ELEMENT_BLOCK]: `createElementBlock`
}
import { PatchFlags } from "packages/shared/src/patchFlags";

function isText(node) {
  return node.type == NodeTypes.INTERPOLATION || node.type == NodeTypes.TEXT;
}


export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return function postTransformElement() { // 元素处理的退出函数
      let vnodeTag = `'${node.tag}'`;
      let properties = [];
      let props = node.props
      for (let i = 0; i < props.length; i++) { // 这里属性其实应该在codegen里在处理
        properties.push({
          key: props[i].name,
          value: props[i].value.content
        })
      }
      const propsExpression = props.length > 0 ? createObjectExpression(properties) : null
      let vnodeChildren = null;
      if (node.children.length === 1) {
        // 只有一个孩子节点 ，那么当生成 render 函数的时候就不用 [] 包裹
        const child = node.children[0];
        vnodeChildren = child;
      } else {
        if (node.children.length > 0) { // 处理儿子节点
          vnodeChildren = node.children
        }
      }
      // 代码生成
      node.codegenNode = createVNodeCall(context, vnodeTag, propsExpression, vnodeChildren);
    }
  }
}

export function transformText(node, context) {
  if (node.type === NodeTypes.ELEMENT || node.type === NodeTypes.ROOT) {
    return () => {
      // 如果这个元素
      let hasText = false;
      const children = node.children;
      let currentContainer = undefined // 合并儿子
      for (let i = 0; i < children.length; i++) {
        let child = children[i];
        if (isText(child)) {
          hasText = true;
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = { // 合并表达式
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  loc: child.loc,
                  children: [child]
                }
              }
              currentContainer.children.push(` + `, next);
              children.splice(j, 1);
              j--;
            } else {
              currentContainer = undefined;
              break;
            }
          }
        }
      }
      if (!hasText || children.length == 1) { // 一个元素不用管，可以执行innerHTML
        return
      }
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (isText(child) || child.type === NodeTypes.COMPOUND_EXPRESSION) {
          const callArgs = []
          callArgs.push(child)
          if (child.type !== NodeTypes.TEXT) { // 如果不是文本
            callArgs.push(PatchFlags.TEXT + '')
          }
          // 全部格式话成文本调用
          children[i] = {
            type: NodeTypes.TEXT_CALL, // 最终需要变成createTextVnode() 增加patchFlag
            content: child,
            loc: child.loc,
            codegenNode: createCallExpression(context, callArgs) // 创建表达式调用
          }
        }
      }
    }
  }
}
function transformExpression(node, context) {
  if (node.type == NodeTypes.INTERPOLATION) {
    node.content.content = `_ctx.${node.content.content}`; // 修改content信息
  }
}


/**
 * 遍历节点
 * vue2 中转化 只做了标记， vue3中patchFlags, block的处理
 * @param node 需要遍历的节点
 * @param context 上下文
 */
function traverseNode(node, context) {
  // 设置当前节点为node
  context.currentNode = node;
  // 获取节点转换方法集合
  const transforms = context.nodeTransforms;
  const exitsFns = [] //存储所有的退出函数
  // 遍历所有转换方法
  for (let i = 0; i < transforms.length; i++) {
    // 调用转化方法进行转化
    let onExit = transforms[i](node, context); // 调用转化方法进行转化
    if (onExit) {
      exitsFns.push(onExit)
    }
    // 如果context.currentNode为空，则终止遍历
    if (!context.currentNode) return
  }
  // 根据节点类型进行不同的处理
  switch (node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      // 遍历节点的子节点
      for (let i = 0; i < node.children.length; i++) {
        // 设置父节点为node
        context.parent = node;
        // 递归遍历子节点
        traverseNode(node.children[i], context);
      }
      break;
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING); // 用于JSON.stringify
      break
  }
  // 最终context.currentNode 是最里面的
  context.currentNode = node; // 修正currentNode;

  let i = exitsFns.length
  while (i--) {
    exitsFns[i]()
  }
}


function createTransformContext(root) {
  const context = {
    currentNode: root, // 当前转化节点 
    parent: null,   // 当前转化节点的父节点
    nodeTransforms: [ // 转化方法
      transformElement,
      transformText,
      transformExpression
    ],
    helpers: new Map(), // 创建帮助映射表，记录调用方法次数
    helper(name) {
      const count = context.helpers.get(name) || 0;
      context.helpers.set(name, count + 1)
      return name
    },
    removeHelper(name) {
      const count = context.helpers.get(name);
      if (count) {
        const currentCount = count - 1;
        if (!currentCount) {
          context.helpers.delete(name);
        } else {
          context.helpers.set(name, currentCount)
        }
      }
    },
  }
  return context
}


/**
 * 创建根代码生成
 *
 * @param root 根节点
 * @param context 上下文
 * @returns 无返回值
 */
function createRootCodegen(root, context) {
  // 获取根节点的子节点
  let { children } = root
  // 如果只有一个子节点
  if (children.length == 1) {
    // 取第一个子节点
    const child = children[0];
    // 如果子节点类型是元素并且有codegenNode属性
    if (child.type === NodeTypes.ELEMENT && child.codegenNode) {
      // 将codegenNode赋值给child的codegenNode属性
      const codegenNode = child.codegenNode;
      // 将child的codegenNode赋值给root的codegenNode
      root.codegenNode = codegenNode;
      // 不要创建元素
      context.removeHelper(CREATE_ELEMENT_VNODE); // 不要创建元素
      // 创建元素block就好了
      context.helper(OPEN_BLOCK)
      context.helper(CREATE_ELEMENT_BLOCK); // 创建元素block就好了
      // 只有一个元素节点，那么他就是block节点
      root.codegenNode.isBlock = true; // 只有一个元素节点，那么他就是block节点
    } else {
      // 直接用里面的节点换掉
      root.codegenNode = child; // 直接用里面的节点换掉
    }
  } else {
    // 创建vnode调用
    root.codegenNode = createVNodeCall(context, context.helper(FRAGMENT), undefined, root.children)
    // 创建block
    context.helper(OPEN_BLOCK)
    // 创建元素block
    context.helper(CREATE_ELEMENT_BLOCK)
    // 增加block fragment
    root.codegenNode.isBlock = true; // 增加block fragment
  }
}


/**
 * 将节点树进行转化
 *
 * @param root 根节点
 */
export function transform(root) {
  // 创建转化的上下文, 记录转化方法及当前转化节点
  let context = createTransformContext(root)
  // 递归遍历
  traverseNode(root, context)

  createRootCodegen(root, context); // 生成根节点的codegen
  root.helpers = [...context.helpers.keys()]
  console.log('root=>', root)
}
