export const patchProp = (el, key, preValue, nextValue) => {
  if (key === 'class') {
    patchClass(el, nextValue)
  } else if (key === 'style') {
    pathStyle(el, preValue, nextValue)
  } else if (/^on[^a-z]/.test(key)) {
    pathEvent(el, key, nextValue)
  }
  else {
    patchAttr(el, key, nextValue)
  }
}



export function patchClass(el, value) {
  if (value === null) {
    el.removeAttribute('class')
  } else {
    el.class = value
  }
}
function pathStyle(el, pre, next) {
  for (let key in next) {
    el.style[key] = next[key]
  }
  if (pre) {
    for (let key in pre) {
      if (next[key] === null) {
        el.style[key] = null
      }
    }
  }
}

const createInvoker = (initiaValue) => {
  const invoker = (e) => invoker.value(e)
  invoker.value = initiaValue
  return invoker

}

function pathEvent(el, rawName, nextValue) {
  const invokers = el._vei || (el._vei = {})
  const exisitingInvoker = invokers[rawName]

  //修改
  if (nextValue && exisitingInvoker) {
    exisitingInvoker.value = nextValue

  }
  // 新增
  if (nextValue && !exisitingInvoker) {
    const name = rawName.slice(2).toLowerCase(); // 转化事件是小写
    const invoker = invokers[rawName] = createInvoker(nextValue)
    el.addEventListener(name, invoker)

  }
  //删除
  if (!nextValue && exisitingInvoker) {
    el.removeEventListener(rawName.slice(2).toLowerCase(), exisitingInvoker)
    invokers[rawName] = undefined
  }
}

function patchAttr(el, key, nextValue) {

  if (nextValue === null || nextValue === undefined) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, nextValue)
  }
}
