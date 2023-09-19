import { nodeOps } from "./nodeOps"
import { patchProp } from "./patchProp"
import { createRenderer } from "@vue/runtime-core";
// 准备好所有渲染时所需要的的属性
const renderOptions = Object.assign({ patchProp }, nodeOps);


export const render = (vnode, container) => {
  createRenderer(renderOptions).render(vnode, container)
}
export * from "@vue/runtime-core";
