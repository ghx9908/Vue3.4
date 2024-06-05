import { nodeOps } from "./nodeOps1"
import { patchProp } from "./patchProp1"
//自己创建渲染器
import { createRenderer } from "@vue/runtime-core";
// 准备好所有渲染时所需要的的属性
const renderOptions = Object.assign({ patchProp }, nodeOps);
// 已经提供好了的渲染器
export const render = (vnode, container) => {
  createRenderer(renderOptions).render(vnode, container)
}
export * from "@vue/runtime-core";


