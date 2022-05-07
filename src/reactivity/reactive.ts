import { isObservable, observable, toJS } from 'mobx';
import { isObject, isFunction } from '../shared';
import { isRef, unRef } from './ref';

export enum ReactiveFlag {
  REACTIVE = '__b_reactive',
  REF = '__b_ref',
  READONLY = '__b_readonly',
}

export function reactive<T extends object>(target: T): T {
  return createReactiveObject(target, false, false);
}

export function shallowReactive<T extends object>(target: T): T {
  return createReactiveObject(target, true, false);
}

export function readonly<T extends object>(target: T): T {
  return createReactiveObject(target, false, true);
}

export function shallowReadonly<T extends object>(target: T): T {
  return createReactiveObject(target, true, true);
}

export function toRaw(target, shallow: boolean = false) {
  let rawTarget = unRef(target);

  // unobserve target if it is observable
  if (isObservable(rawTarget)) {
    rawTarget = toJS(target);
  }

  // recursively convert nested reactive objects to raw objects
  if (!shallow && isObject(rawTarget)) {
    for (const key in rawTarget) {
      rawTarget[key] = toRaw(rawTarget[key]);
    }
  }

  return rawTarget;
}

export function isReactive(target) {
  return isObject(target) && isObservable(target) && !!target[ReactiveFlag.REACTIVE];
}

export function isReadonly(target) {
  return isObject(target) && !!target[ReactiveFlag.READONLY];
}

function createReactiveObject<T extends object>(target: T, shallow: boolean, readonly: boolean): T {
  // avoid trying to observe a readonly object, and avoid observing reactive object twice
  if (isReadonly(target) || (isReactive(target) && !readonly)) {
    return target;
  }

  const observed = isObservable(target) ? target : observable(target, {}, { deep: !shallow });

  return createReactiveProxy(observed, shallow, readonly);
}

function createReactiveProxy<T extends object>(target: T, shallow: boolean, readonly: boolean): T {
  return new Proxy(target, {
    get(target, key) {
      if (key === ReactiveFlag.REACTIVE) {
        return !readonly;
      } else if (key === ReactiveFlag.READONLY) {
        return readonly;
      }

      let value = unRef(Reflect.get(target, key));

      // stop recurse if value is primitive data type
      if (!isObject(value) && !isFunction(value)) {
        return value;
      }

      // bind target to function's this
      if (isFunction(value)) {
        value = value.bind(target);
      }

      if (shallow) {
        return value;
      }

      return createReactiveProxy(value, shallow, readonly);
    },
    set(target, key, value) {
      if (readonly) {
        throw new Error(`Cannot set property ${String(key)} on readonly object`);
      }
      return Reflect.set(target, key, value);
    },
  });
}
