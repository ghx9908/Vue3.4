import { currentInstance } from "./component";

export function inject(key, defaultValue) {
  if (!currentInstance) return;
  const provides = currentInstance.parent.provides;
  if (provides && key in provides) {
    return provides[key];
  } else if (arguments.length > 1) {
    return defaultValue;
  }
}


export function provide(key, value) {
  if (!currentInstance) return;
  let provides = currentInstance.provides
  const parentProvides =
    currentInstance.parent && currentInstance.parent.provides
  if (parentProvides === provides) {
    provides = currentInstance.provides = Object.create(parentProvides)
  }

  provides[key] = value;

}


