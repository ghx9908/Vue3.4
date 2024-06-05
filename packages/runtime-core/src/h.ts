import { isObject } from "@vue/shared"
import { createVNode, isVNode } from "./createVNode"

export function h(type, propsOrChildern, children?) {
  const l = arguments.length
  if (l === 2) {

    if (isObject(propsOrChildern) && !Array.isArray(propsOrChildern)) {
      if (isVNode(propsOrChildern)) { //  h('div',h('span'))
        return createVNode(type, null, [propsOrChildern])
      }

      return createVNode(type, propsOrChildern)//  h('div',{style:{color:'red'}});

    } else {
      return createVNode(type, null, propsOrChildern) // h("h1", "hello world")  h("div", [h("h1", "hello"), h("h1", "hello")]) 
    }
  } else {
    if (l > 3) {//超过3个除了前两个都是孩子
      children = Array.prototype.slice.call(arguments, 2)
    } else if (l === 3 && isVNode(children)) {
      children = [children]// h('div',null,[h('span')])
    }

    return createVNode(type, propsOrChildern, children)

  }
}

