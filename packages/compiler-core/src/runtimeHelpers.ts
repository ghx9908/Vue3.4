import { NodeTypes } from "./ast";

export const TO_DISPLAY_STRING = Symbol(`toDisplayString`);
export const CREATE_TEXT = Symbol("createTextVNode");
export const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
export const FRAGMENT = Symbol("FRAGMENT");
export const CREATE_ELEMENT_BLOCK = Symbol(`createElementBlock`)
export const OPEN_BLOCK = Symbol(`openBlock`)
export const helperNameMap = {
  [TO_DISPLAY_STRING]: "toDisplayString",
  [CREATE_TEXT]: "createTextVNode",
  [CREATE_ELEMENT_VNODE]: "createElementVNode", // 创建元素节点标识
  [FRAGMENT]: "Fragment",
  [OPEN_BLOCK]: `openBlock`,  // block处理
  [CREATE_ELEMENT_BLOCK]: `createElementBlock`
}


export function createCallExpression(context, args) {
  context.helper(CREATE_TEXT);
  return {
    type: NodeTypes.JS_CALL_EXPRESSION, // createTextVnode()
    arguments: args,
  };
}

export function createVNodeCall(context, tag, props, children) {
  context.helper(CREATE_ELEMENT_VNODE);
  return {
    type: NodeTypes.VNODE_CALL,//createElementVNode
    tag,
    props,
    children
  }
}

export function createObjectExpression(properties) {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    properties
  }
}
