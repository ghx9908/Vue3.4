export const hasPropsChanged = (prevProps = {}, nextProps = {}) => {
  const nextKeys = Object.keys(nextProps);
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true;
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];
    if (nextProps[key] !== prevProps[key]) {
      return true;
    }
  }
  return false;
};
export function updateProps(instance, prevProps, nextProps) {
  if (hasPropsChanged(prevProps, nextProps)) {
    // 比较前后属性是否一致
    for (const key in nextProps) {
      // 循环props
      instance.props[key] = nextProps[key]; // 响应式属性更新后会重新渲染
    }
    for (const key in instance.props) {
      // 循环props
      if (!(key in nextProps)) {
        delete instance.props[key];
      }
    }
  }
}
