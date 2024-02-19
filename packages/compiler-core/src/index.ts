import { baseParse } from "./parser";

export function compile(template) {
  // 1.将模板转化成ast语法树
  return baseParse(template);

}
