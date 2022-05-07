import { isObservable, observable, toJS } from 'mobx';
import { isObject } from '../shared';

export function reactive<T extends object>(target: T): T {
  return createReactiveObject(target, false);
}

export function shallowReactive<T extends object>(target: T): T {
  return createReactiveObject(target, true);
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
  return isObservable(target);
}

function createReactiveObject<T extends object>(target: T, shallow: boolean): T {
  if (isReactive(target)) return target;

  return observable(target, {}, { deep: !shallow });
}
