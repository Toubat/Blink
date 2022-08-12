import { makeAutoObservable } from "mobx";
import { hasChanged, isObject, warn } from "../shared";
import { CollectionTypes } from "./collectionHandlers";
import { untrack } from "./effect";
import { reactive, ReactiveFlag, readonly, toRaw } from "./reactive";

export type Ref<T = any> = {
  value: T;
  [ReactiveFlag.REF]: true;
};

/**
 * Convert object values into computed refs that capture object value.
 */
export type ToRefs<T extends object> = {
  [key in keyof T]: Ref<UnwrapRef<T[key]>>;
};

type BaseTypes = string | number | boolean;

export type UnwrapRef<T> = T extends Ref<infer V> ? UnwrapRef<V> : UnwrapRefSimple<T>;
export type UnwrapNestedRefs<T> = T extends Ref<infer V> ? Ref<UnwrapRef<V>> : UnwrapRefSimple<T>;
export type UnwrapRefSimple<T> = T extends Ref
  ? never
  : T extends Function | CollectionTypes | BaseTypes
  ? T
  : T extends Array<any>
  ? { [K in keyof T]: UnwrapRefSimple<T[K]> }
  : T extends object
  ? {
      [P in keyof T]: P extends symbol ? T[P] : UnwrapRef<T[P]>;
    }
  : T;

export class RefImpl<T> implements Ref<T> {
  private _value: T;
  private _rawValue: T;
  // reactive flags
  public readonly __b_ref = true;

  constructor(value: T, public readonly __b_shallow: boolean) {
    makeAutoObservable(this, {}, { deep: false });
    this._rawValue = __b_shallow ? value : toRaw(value);
    this._value = __b_shallow ? value : toReactive(value);
  }

  get value() {
    return this._value;
  }

  set value(newValue) {
    untrack(() => {
      newValue = this.__b_shallow ? newValue : toRaw(newValue);
      if (hasChanged(newValue, this._rawValue)) {
        this._rawValue = newValue;
        this._value = this.__b_shallow ? newValue : toReactive(newValue);
      }
    });
  }
}

function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}

export function isRef(target) {
  return isObject(target) && !!target[ReactiveFlag.REF];
}

export function unRef(target) {
  return isRef(target) ? target.value : target;
}

export function ref<T>(value: T): Ref<UnwrapRef<T>>;
export function ref(value) {
  if (isRef(value)) return value;

  return new RefImpl(value, false);
}

export function shallowRef<T>(value: T): Ref<UnwrapRef<T>>;
export function shallowRef(value) {
  if (isRef(value)) return value;

  return new RefImpl(value, true);
}

export function readonlyRef<T>(target: T): T extends Ref ? T : Ref<T>;
export function readonlyRef(target) {
  if (isRef(target)) return readonly(target);

  return new Proxy(
    {
      value: target,
      [ReactiveFlag.REF]: true,
    },
    {
      get(target, key) {
        return Reflect.get(target, key);
      },
      set(target, key, value) {
        warn(`Cannot set key "${String(key)}" on readonly object`);
        return true;
      },
    }
  );
}

export function proxyRef<T extends object>(target: T): UnwrapNestedRefs<T>;
export function proxyRef(target) {
  return new Proxy(target, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
    set(target, key, value) {
      const res = untrack(() => Reflect.get(target, key));

      if (isRef(res) && !isRef(value)) {
        return (res.value = value);
      } else {
        return Reflect.set(target, key, value);
      }
    },
  });
}
