import { reactive } from "@vue/reactivity";
export function initProps(instance, rawProps) {
  const props = {};
  const attrs = {};
  const options = instance.propsOptions || {};
  if (rawProps) {
    for (let key in rawProps) {
      if (key in options) {
        props[key] = rawProps[key];
      } else {
        attrs[key] = rawProps[key];
      }
    }
  }
  // 属性是响应式的，属性变化了 会造成页面更新
  instance.props = reactive(props); // 属性会被变成响应式  props也可以不是响应式的
  instance.attrs = attrs;
}
