

export function isRef(value) {
  return !!(value && value.__v_isRef);
}
