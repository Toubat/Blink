import { computed, isReadonly, proxyRef, readonly, Ref, ToRefs, UnwrapRef } from "../index";
import { error, isFunction, isPrimitive, warn } from "../shared";
import { createJSXElement } from "./jsx-element";

export const h = createJSXElement;

export function r<T>(fn: () => T): Ref<UnwrapRef<T>> {
  if (!isFunction(fn)) {
    error(`Expected a function input to r(), but got ${fn} instead.`);
  }

  return proxyRef(computed(fn));
}

export function rs<T extends object>(target: T): ToRefs<T> {
  const refs = {} as ToRefs<T>;

  for (const key in target) {
    refs[key] = r(() => target[key]);
  }

  return refs;
}
