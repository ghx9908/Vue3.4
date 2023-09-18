import { nodeOps } from "./nodeOps"
import { patchProp } from "./patchProp"

// 准备好所有渲染时所需要的的属性
const renderOptions = Object.assign({ patchProp }, nodeOps);
