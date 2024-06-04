import { isFunction, isObject } from "@vue/shared";
import { isReactive } from "./reactivity";
import { ReactiveEffect } from "./effect";
import { isRef } from "./ref";

export function watch(source, cb, option?) {
  return doWatch(source, cb, option)
}


export function watchEffect(effect, option) {
  return doWatch(effect, null, option)
}

function doWatch(source, cb, { immediate, deep }) {
  let getter;
  if (isFunction(source)) {
    getter = source
  } else if (isReactive(source)) {
    getter = () => traverse(source, deep === false ? 1 : undefined)
  } else if (isRef(source)) {
    getter = () => source.value

  }

  let cleanup;
  function onCleanup(fn) {
    cleanup = () => {
      fn();
      cleanup = undefined
    }
  }

  const job = () => {
    if (cb) {
      if (cleanup) {
        cleanup();
      }
      let newVal = effect.run()
      cb(newVal, oldVal, onCleanup)
      oldVal = newVal
    } else {
      effect.run()
    }
  }


  const effect = new ReactiveEffect(getter, job)


  const noWatch = () => {
    effect.stop()
  }
  let oldVal
  if (cb) {

    if (immediate) {
      job()
    }
  } else {
    oldVal = effect.run()
  }

  return noWatch

}


function traverse(value, depth = Infinity, seen = new Set()) {
  if (depth <= 0) {
    return value
  }
  if (!isObject(value)) {
    return value
  }
  if (seen.has(value)) {
    return value
  }
  depth--

  seen.add(value)

  for (let key in value) {
    traverse(value[key], depth, seen)
  }

  return value
}
