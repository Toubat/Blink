import { bind, error, isFunction, toDerivedValue, warn } from "../shared";
import { computed } from "./computed";
import { proxyRef, ref, Ref, ToRefs, UnwrapRef } from "./ref";

/**
 * Convert object values into void callbacks that capture object value.
 */
export type ToCallbacks<T extends object> = {
  [key in keyof T]: ToCallback<T[key]>;
};
export type ToCallback<T> = () => T;

/**
 * Convert object values callbacks into value returned by callback.
 */
export type ToValues<T extends object> = {
  [key in keyof T]: ToValue<T[key]>;
};
export type ToValue<T> = T extends () => infer V ? UnwrapRef<V> : UnwrapRef<T>;

export function r<T>(fn: () => T): Ref<UnwrapRef<T>> {
  if (!isFunction(fn)) {
    error(`Expected a function input to r(), but got ${fn} instead.`);
  }

  return proxyRef(computed(fn)) as Ref<UnwrapRef<T>>;
}

export function rs<T extends object>(target: T): ToRefs<T> {
  const refs = {} as ToRefs<T>;

  for (const key in target) {
    refs[key] = r(() => target[key]);
  }

  return refs;
}

export function cs<T extends object>(target: T): ToCallbacks<T> {
  const refs = {} as ToCallbacks<T>;

  for (const key in target) {
    refs[key] = () => target[key];
  }

  return refs;
}

export function derived<T extends object>(target: T): ToValues<T> {
  return new Proxy(target, {
    get(target, key) {
      const value = bind(target, Reflect.get(target, key));

      return toDerivedValue(value);
    },
    set(_, key) {
      warn(`Cannot set key "${String(key)}" on readonly object`);
      return true;
    },
  }) as ToValues<T>;
}
