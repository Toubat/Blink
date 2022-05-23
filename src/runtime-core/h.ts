import { computed } from "../reactivity";
import { createJSXElement } from "./jsx-element";

export const h = createJSXElement;

export function r<T>(fn: () => T) {
  return computed(fn);
}
