import { isObservable, observable, toJS } from 'mobx';
import { isObject, isPrimitive, toRawType } from '../shared';
import { getBaseHandler } from './baseHandlers';
import { getCollectionHandlers } from './collectionHandlers';
import { unRef } from './ref';

export enum ReactiveFlag {
  REACTIVE = '__b_reactive',
  REF = '__b_ref',
  READONLY = '__b_readonly',
}

const enum TargetType {
  INVALID = 0,
  COMMON = 1,
  COLLECTION = 2,
}

function targetTypeMap(rawType: string) {
  switch (rawType) {
    case 'Object':
    case 'Array':
      return TargetType.COMMON;
    case 'Map':
    case 'Set':
    case 'WeakMap':
    case 'WeakSet':
      return TargetType.COLLECTION;
    default:
      return TargetType.INVALID;
  }
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

export function toRaw<T>(target: T, shallow: boolean = false): T {
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

  const observed =
    isObservable(target) || readonly ? target : observable(target, {}, { deep: !shallow });

  return createReactiveProxy(observed, shallow, readonly);
}

export function createReactiveProxy<T extends object>(
  target: T,
  isShallow: boolean,
  isReadonly: boolean
): T {
  // stop recurse if value is primitive data type
  if (isPrimitive(target)) return target;

  const targetType = targetTypeMap(toRawType(target));

  // proxy handlers
  const baseHandler = getBaseHandler(isShallow, isReadonly);
  const collectionHandler = getCollectionHandlers(isShallow, isReadonly);

  const handler = targetType === TargetType.COLLECTION ? collectionHandler : baseHandler;

  return new Proxy(target, handler as ProxyHandler<T>);
}
