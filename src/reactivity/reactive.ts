import { isObservable, observable, toJS } from 'mobx';
import { isObject, isFunction } from '../shared';
import { unRef } from './ref';

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

export function toRaw(target, shallow: boolean = false) {
  let rawTarget = target;

  if (isReactive(target)) {
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
  if (isReactive(target)) return target;

  const observed = observable(target, {}, { deep: !shallow });

  return reactiveProxy(observed, shallow, readonly);
}

function reactiveProxy(target, shallow, readonly) {
  return new Proxy(target, {
    get(target, key) {
      if (key === ReactiveFlag.REACTIVE) {
        return !readonly;
      } else if (key === ReactiveFlag.READONLY) {
        return readonly;
      }

      let value = unRef(Reflect.get(target, key));

      if (!isObject(value) && !isFunction(value)) {
        return value;
      }

      if (isFunction(value)) {
        value = value.bind(target);
      }

      if (shallow) {
        return value;
      }

      return reactiveProxy(value, shallow, !readonly);
    },
    set(target, key, value) {
      if (readonly) {
        throw new Error(`Cannot set property ${String(key)} on reaonly object`);
      }
      return Reflect.set(target, key, value);
    },
  });
}
