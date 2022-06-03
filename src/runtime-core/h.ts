import { computed } from "../index";
import { isFunction, warn } from "../shared";
import { createJSXElement } from "./jsx-element";

export const h = createJSXElement;

export function r<T>(fn: () => T) {
  if (!isFunction(fn)) {
    return warn(`Expected a function input to r(), but got ${fn} instead.`);
  }
  return computed(fn);
}
