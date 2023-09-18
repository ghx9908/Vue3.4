
// 比对属性方法
export const patchProp = (el, key, prevValue, nextValue) => {
  if (key === 'class') {
    patchClass(el, nextValue)
  } else if (key === 'style') {
    patchStyle(el, prevValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    patchEvent(el, key, nextValue)
  } else {
    patchAttr(el, key, nextValue)
  }
}

// 操作类名
function patchClass(el, value) { // 根据最新值设置类名
  // class:"abc" class:"abc bcd efg"
  if (value == null) {
    el.removeAttribute('class');
  } else {
    el.className = value;
  }
}

// 操作样式
function patchStyle(el, prev, next) { // 更新style
  // 旧的{color:red,font-size:18px},  新的{background:red，color:blue}
  const style = el.style;
  for (const key in next) { // 用最新的直接覆盖
    style[key] = next[key]
  }
  if (prev) {
    for (const key in prev) {// 老的有新的没有删除
      if (next[key] == null) {
        style[key] = null
      }
    }
  }
}


// 操作事件
/**
 * 创建事件回调函数
 * @param {Function} initialValue 事件回调函数 
 */
function createInvoker(initialValue) {
  const invoker = (e) => invoker.value(e);
  invoker.value = initialValue;
  return invoker;
}

/**
 * 更新元素的事件回调
 * @param {Element} el 元素 
 * @param {string} rawName 事件名
 * @param {Function | null} nextValue 新的事件回调
 */
function patchEvent(el, rawName, nextValue) {  // 更新事件
  // 元素的事件回调函数缓存对象
  const invokers = el._vei || (el._vei = {});
  // 当前事件名对应的回调函数
  const exisitingInvoker = invokers[rawName]; // 是否缓存过

  if (nextValue && exisitingInvoker) {
    // 如果已有缓存的回调,直接更新为新函数
    exisitingInvoker.value = nextValue;
  } else {
    // 转换为小写事件名
    const name = rawName.slice(2).toLowerCase();
    if (nextValue) {
      // 没有缓存,新建一个事件回调并缓存
      const invoker = (invokers[rawName]) = createInvoker(nextValue);
      el.addEventListener(name, invoker);
    } else if (exisitingInvoker) {
      // 如果传入空,则移除对应的事件监听
      el.removeEventListener(name, exisitingInvoker);
      invokers[rawName] = undefined
    }
  }
}


function patchAttr(el, key, value) { // 更新属性
  if (value == null) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
}
