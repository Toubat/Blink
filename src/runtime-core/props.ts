import { effect, unRef } from "../reactivity";
import { isArray, isNull, isObject, isString } from "../shared";

export function setProps<T extends HTMLElement>(props: object, el: T) {
  for (let key in props) {
    effect(() => setProp(key, props[key], el));
  }
}

export function setProp<T extends HTMLElement>(key: string, value: any, el: T) {
  switch (key) {
    case "class":
      if (isString(value)) return effect(() => (el.className = unRef(value)));
      if (isArray(value)) {
        return value.forEach(
          (className) => !isNull(unRef(className)) && el.classList.add(unRef(className))
        );
      }
      if (isObject(value)) {
        return Object.entries(value).forEach(([className, active]: [string, any]) =>
          effect(() =>
            unRef(active) ? el.classList.add(className) : el.classList.remove(className)
          )
        );
      }
    case "style":
      if (isString(value)) return (el.style.cssText = value);
      if (isObject(value)) {
        return Object.entries(value).forEach(([key, value]: [string, any]) =>
          effect(() => el.style.setProperty(key, unRef(value)))
        );
      }
    default:
      effect(() => el.setAttribute(key, value));
  }
}
