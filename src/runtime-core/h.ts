import { computed, proxyRef, readonly, Ref, ToRefs, untrack, readonlyRef } from "../index";
import { error, isFunction, isPrimitive, warn } from "../shared";
import { createJSXElement } from "./jsx-element";

export const h = createJSXElement;

export function r<T>(fn: () => T): Ref<T> {
  const value = untrack(fn);

  if (isPrimitive(value)) {
    return readonlyRef(value) as Ref<T>;
  }

  if (!isFunction(fn)) {
    error(`Expected a function input to r(), but got ${fn} instead.`);
  }

  return readonly(proxyRef(computed(fn)));
}

export function rs<T extends object>(target: T): ToRefs<T> {
  const refs = {} as ToRefs<T>;

  for (const key in target) {
    refs[key] = r(() => target[key]);
  }

  return refs;
}
